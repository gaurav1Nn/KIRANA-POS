"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useProductStore, useCartStore } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Camera, X } from "lucide-react"
import type { Product } from "@/lib/types"

interface ProductSearchProps {
  onQuickAdd?: () => void
}

export function ProductSearch({ onQuickAdd }: ProductSearchProps) {
  const [query, setQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<Product[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const { searchProducts, products } = useProductStore()
  const { addItem } = useCartStore()

  // Auto-focus search input
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Handle search
  useEffect(() => {
    if (query.length >= 1) {
      const found = searchProducts(query)
      setResults(found.slice(0, 10))
      setShowResults(true)
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && results.length > 0) {
      handleSelect(results[0])
    }
    if (e.key === "Escape") {
      setShowResults(false)
      setQuery("")
    }
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
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query && setShowResults(true)}
            className="pl-10 h-12 text-lg"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => {
                setQuery("")
                inputRef.current?.focus()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button variant="outline" size="icon" className="h-12 w-12 bg-transparent">
          <Camera className="h-5 w-5" />
        </Button>
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-80 overflow-auto">
          {results.length > 0 ? (
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
    </div>
  )
}
