"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { useProductStore, useCartStore } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, AlertTriangle, Barcode } from "lucide-react"
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
  const [scannerMode, setScannerMode] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const lastInputTimeRef = useRef<number>(0)
  const inputBufferRef = useRef<string>("")
  const scannerTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { searchProducts, getProductByBarcode } = useProductStore()
  const { addItem } = useCartStore()

  // Auto-focus search input
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleBarcodeScanner = useCallback(
    async (barcode: string) => {
      const cleanBarcode = barcode.trim()
      if (!cleanBarcode) return

      setIsSearching(true)
      setScannerMode(true)

      try {
        const { product, duplicates } = await getProductByBarcode(cleanBarcode)

        if (duplicates.length > 1) {
          // Multiple products with same barcode - show selection dialog
          setDuplicateProducts(duplicates)
          setShowDuplicateDialog(true)
          setQuery("")
          setShowResults(false)
        } else if (product) {
          // Single product found - add to cart immediately
          addItem(product)
          setQuery("")
          setShowResults(false)
          // Play success feedback
          try {
            const audio = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU")
          } catch {}
        } else {
          // No exact barcode match - show search results
          const searchResults = await searchProducts(cleanBarcode)
          if (searchResults.length > 0) {
            setResults(searchResults.slice(0, 10))
            setShowResults(true)
          } else {
            // No results at all
            setResults([])
            setShowResults(true)
          }
        }
      } catch (error) {
        console.error("Barcode search error:", error)
      } finally {
        setIsSearching(false)
        setScannerMode(false)
      }
    },
    [getProductByBarcode, searchProducts, addItem],
  )

  // Handle search with debounce
  useEffect(() => {
    if (query.length >= 1 && !scannerMode) {
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
      }, 200)

      return () => clearTimeout(timeoutId)
    } else if (!scannerMode) {
      setResults([])
      setShowResults(false)
    }
  }, [query, searchProducts, scannerMode])

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
    const now = Date.now()

    if (e.key === "Enter") {
      e.preventDefault()

      // Check if we have accumulated scanner input
      const buffer = inputBufferRef.current.trim()
      if (buffer.length >= 4) {
        handleBarcodeScanner(buffer)
        inputBufferRef.current = ""
        setQuery("")
        return
      }

      // Check current query as potential barcode (numeric, 4+ characters)
      const currentQuery = query.trim()
      if (currentQuery.length >= 4 && /^\d+$/.test(currentQuery)) {
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
      inputBufferRef.current = ""
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const now = Date.now()
    const timeSinceLastInput = now - lastInputTimeRef.current
    lastInputTimeRef.current = now

    setQuery(value)

    // Clear existing timeout
    if (scannerTimeoutRef.current) {
      clearTimeout(scannerTimeoutRef.current)
    }

    // Barcode scanner detection logic:
    // - Scanners type very fast (< 50ms between characters)
    // - They typically send only digits
    // - They usually send 8-13 characters followed by Enter

    if (timeSinceLastInput < 50 && /^\d+$/.test(value)) {
      // Fast numeric input - likely a barcode scanner
      inputBufferRef.current = value
      setScannerMode(true)

      // Auto-process after brief pause (scanner will send Enter, but this is backup)
      scannerTimeoutRef.current = setTimeout(() => {
        if (inputBufferRef.current.length >= 4) {
          handleBarcodeScanner(inputBufferRef.current)
          inputBufferRef.current = ""
          setQuery("")
        }
        setScannerMode(false)
      }, 150)
    } else if (timeSinceLastInput > 100) {
      // Slow input - regular keyboard typing
      inputBufferRef.current = ""
      setScannerMode(false)
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
            onFocus={() => query && !scannerMode && setShowResults(true)}
            className="pl-10 pr-20 h-12 text-lg"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {scannerMode && (
              <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                <Barcode className="h-3 w-3" />
                Scanning...
              </span>
            )}
            {query && !scannerMode && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setQuery("")
                  inputBufferRef.current = ""
                  inputRef.current?.focus()
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {showResults && !scannerMode && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-80 overflow-auto">
          {isSearching ? (
            <div className="p-4 text-center text-muted-foreground">Searching...</div>
          ) : results.length > 0 ? (
            <div className="p-1">
              {results.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className="w-full flex items-center justify-between p-3 hover:bg-accent rounded-md text-left transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {index === 0 && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Press Enter</span>
                      )}
                      <p className="font-medium truncate">{product.name}</p>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {product.barcode || "No barcode"} • {product.category} • {product.brand || "Generic"}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-primary">₹{product.sellingPrice.toFixed(2)}</p>
                    <p
                      className={`text-sm ${product.currentStock <= product.minStockLevel ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      Stock: {product.currentStock}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 1 ? (
            <div className="p-4 text-center">
              <p className="text-muted-foreground mb-2">No products found for "{query}"</p>
              {onQuickAdd && (
                <Button variant="outline" size="sm" onClick={onQuickAdd}>
                  Add New Product
                </Button>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Duplicate Barcode Dialog */}
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
                    {product.brand || "Generic"} • {product.category} • {product.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">₹{product.sellingPrice.toFixed(2)}</p>
                  <p
                    className={`text-sm ${product.currentStock <= product.minStockLevel ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    Stock: {product.currentStock}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Tip: Consider updating barcodes to avoid duplicates in Product Management
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
