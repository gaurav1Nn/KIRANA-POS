"use client"

import { useState } from "react"
import { useProductStore, useCartStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { CATEGORIES } from "@/lib/types"
import { ScrollArea } from "@/components/ui/scroll-area"

export function CategoryShortcuts() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { products } = useProductStore()
  const { addItem } = useCartStore()

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.status === "active" && p.category === selectedCategory)
    : products.filter((p) => p.status === "active").slice(0, 20)

  return (
    <div className="flex flex-col h-full">
      {/* Category Buttons */}
      <div className="p-3 border-b border-border">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <ScrollArea className="flex-1 p-3">
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addItem(product)}
              className="p-3 text-left rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
            >
              <p className="font-medium text-sm truncate">{product.name}</p>
              <p className="text-lg font-bold text-primary">₹{product.sellingPrice.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Stock: {product.currentStock}</p>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
