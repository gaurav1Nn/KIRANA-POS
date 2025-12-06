"use client"

import { useState } from "react"
import { useProductStore, useAuthStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Plus, MoreHorizontal, Pencil, Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { CATEGORIES } from "@/lib/types"
import type { Product } from "@/lib/types"

interface ProductListProps {
  onAdd: () => void
  onEdit: (product: Product) => void
}

export function ProductList({ onAdd, onEdit }: ProductListProps) {
  const { products, deleteProduct, isLoading } = useProductStore()
  const { isOwner } = useAuthStore()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [stockFilter, setStockFilter] = useState<string>("all")
  const [deleting, setDeleting] = useState<string | null>(null)

  const filteredProducts = products.filter((product) => {
    if (product.status === "inactive") return false

    const matchesSearch =
      search === "" ||
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.barcode?.includes(search) ||
      product.brand?.toLowerCase().includes(search.toLowerCase())

    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter

    let matchesStock = true
    if (stockFilter === "low") {
      matchesStock = product.currentStock <= product.minStockLevel && product.currentStock > 0
    } else if (stockFilter === "out") {
      matchesStock = product.currentStock === 0
    }

    return matchesSearch && matchesCategory && matchesStock
  })

  const handleDelete = async (productId: string) => {
    setDeleting(productId)
    try {
      await deleteProduct(productId)
    } catch (error) {
      console.error("Failed to delete product:", error)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, barcode, or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={onAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Products Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Purchase</TableHead>
              <TableHead className="text-right">Selling</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">GST</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground mt-2">Loading products...</p>
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.barcode || "No barcode"}
                        {product.brand && ` • ${product.brand}`}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right">₹{product.purchasePrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">₹{product.sellingPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {product.currentStock <= product.minStockLevel && (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                      <span
                        className={product.currentStock <= product.minStockLevel ? "text-amber-600 font-medium" : ""}
                      >
                        {product.currentStock} {product.unit}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{product.gstRate}%</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(product)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {isOwner() && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(product.id)}
                            disabled={deleting === product.id}
                          >
                            {deleting === product.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredProducts.length} of {products.filter((p) => p.status === "active").length} products
      </div>
    </div>
  )
}
