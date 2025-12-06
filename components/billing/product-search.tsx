"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { useProductStore, useCartStore } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, AlertTriangle } from "lucide-react"
import type { Product } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ProductSearchProps {
  onQuickAdd?: () => void
}

export function ProductSearch({ onQuickAdd }: ProductSearchProps) {
  const [query, setQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [duplicateProducts, setDuplicateProducts] = useState<Product[]>([])
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const barcodeBufferRef = useRef<string>("")
  const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { searchProducts, getProductByBarcode, products } = useProductStore()
  const { addItem } = useCartStore()

  // Auto-focus search input
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleBarcodeScanner = useCallback(
    async (barcode: string) => {
      setIsSearching(true)
      try {
        const { product, duplicates } = await getProductByBarcode(barcode)

        if (duplicates.length > 1) {
          // Multiple products with same barcode - show selection dialog
          setDuplicateProducts(duplicates)
          setShowDuplicateDialog(true)
          setQuery("")
        } else if (product) {
          // Single product found - add to cart
          addItem(product)
          setQuery("")
          setShowResults(false)
        } else {
          // No exact match - do regular search
          const searchResults = await searchProducts(barcode)
          setResults(searchResults.slice(0, 10))
          setShowResults(true)
        }
      } catch (error) {
        console.error("Barcode search error:", error)
      } finally {
        setIsSearching(false)
      }
    },
    [getProductByBarcode, searchProducts, addItem],
  )

  // Handle search with debounce
  useEffect(() => {
    if (query.length >= 1) {
      const timeoutId = setTimeout(async () => {
        setIsSearching(true)
        try {
          const found = await searchProducts(query)
          setResults(found.slice(0, 10))
          setShowResults(true)
        } catch (error) {
          console.error("Search error:", error)
        } finally {
          setIsSearching(false)
        }
      }, 150)

      return () => clearTimeout(timeoutId)
    } else {
      setResults([])
      setShowResults(false)
    }
  }, [query, searchProducts])

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (product: Product) => {
    addItem(product)
    setQuery("")
    setShowResults(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Barcode scanners typically send data very fast followed by Enter
    if (e.key === "Enter") {
      e.preventDefault()

      // Check if we have a barcode in buffer (scanner input)
      if (barcodeBufferRef.current.length >= 8) {
        handleBarcodeScanner(barcodeBufferRef.current)
        barcodeBufferRef.current = ""
        return
      }

      // Check current query as potential barcode
      const currentQuery = query.trim()
      if (currentQuery.length >= 8 && /^\d+$/.test(currentQuery)) {
        // Looks like a barcode (8+ digits)
        handleBarcodeScanner(currentQuery)
        return
      }

      // Regular search - select first result
      if (results.length > 0) {
        handleSelect(results[0])
      }
    }

    if (e.key === "Escape") {
      setShowResults(false)
      setQuery("")
      barcodeBufferRef.current = ""
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    // Clear existing timeout
    if (barcodeTimeoutRef.current) {
      clearTimeout(barcodeTimeoutRef.current)
    }

    // If input looks like barcode (only digits), accumulate in buffer
    if (/^\d+$/.test(value)) {
      barcodeBufferRef.current = value

      // Auto-detect barcode after short delay (scanners are fast)
      barcodeTimeoutRef.current = setTimeout(() => {
        if (barcodeBufferRef.current.length >= 8) {
          handleBarcodeScanner(barcodeBufferRef.current)
          barcodeBufferRef.current = ""
        }
      }, 100) // 100ms - enough for scanner, but not regular typing
    } else {
      barcodeBufferRef.current = ""
    }
  }

  const handleSelectDuplicate = (product: Product) => {
    addItem(product)
    setShowDuplicateDialog(false)
    setDuplicateProducts([])
    inputRef.current?.focus()
  }

  return (
    <div className="relative" ref={resultsRef}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Scan barcode or search product..."
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => query && setShowResults(true)}
            className="pl-10 h-12 text-lg"
            autoComplete="off"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => {
                setQuery("")
                barcodeBufferRef.current = ""
                inputRef.current?.focus()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-80 overflow-auto">
          {isSearching ? (
            <div className="p-4 text-center text-muted-foreground">Searching...</div>
          ) : results.length > 0 ? (
            <div className="p-1">
              {results.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className="w-full flex items-center justify-between p-3 hover:bg-accent rounded-md text-left transition-colors"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.barcode || "No barcode"} • {product.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">₹{product.sellingPrice.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Stock: {product.currentStock}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 1 ? (
            <div className="p-4 text-center">
              <p className="text-muted-foreground mb-2">No products found</p>
              {onQuickAdd && (
                <Button variant="outline" size="sm" onClick={onQuickAdd}>
                  Add New Product
                </Button>
              )}
            </div>
          ) : null}
        </div>
      )}

      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Multiple Products Found
            </DialogTitle>
            <DialogDescription>
              This barcode is associated with multiple products. Please select the correct one:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-auto">
            {duplicateProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => handleSelectDuplicate(product)}
                className="w-full flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent transition-colors text-left"
              >
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.brand} • {product.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">₹{product.sellingPrice.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Stock: {product.currentStock}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
