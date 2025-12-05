"use client"

import { useState } from "react"
import { useProductStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, AlertTriangle, Package } from "lucide-react"
import { CATEGORIES } from "@/lib/types"

export function StockReport() {
  const { products } = useProductStore()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [stockFilter, setStockFilter] = useState<string>("all")

  const activeProducts = products.filter((p) => p.status === "active")

  const filteredProducts = activeProducts.filter((product) => {
    const matchesSearch =
      search === "" || product.name.toLowerCase().includes(search.toLowerCase()) || product.barcode?.includes(search)

    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter

    let matchesStock = true
    if (stockFilter === "low") {
      matchesStock = product.currentStock <= product.minStockLevel && product.currentStock > 0
    } else if (stockFilter === "out") {
      matchesStock = product.currentStock === 0
    } else if (stockFilter === "ok") {
      matchesStock = product.currentStock > product.minStockLevel
    }

    return matchesSearch && matchesCategory && matchesStock
  })

  const totalStockValue = filteredProducts.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0)
  const totalRetailValue = filteredProducts.reduce((sum, p) => sum + p.currentStock * p.sellingPrice, 0)
  const lowStockCount = activeProducts.filter((p) => p.currentStock <= p.minStockLevel && p.currentStock > 0).length
  const outOfStockCount = activeProducts.filter((p) => p.currentStock === 0).length

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{activeProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Stock Value (Cost)</p>
              <p className="text-xl font-bold">
                ₹{totalStockValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Stock Value (Retail)</p>
              <p className="text-xl font-bold text-emerald-600">
                ₹{totalRetailValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={lowStockCount + outOfStockCount > 0 ? "border-amber-200" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${lowStockCount + outOfStockCount > 0 ? "bg-amber-100" : "bg-muted"}`}>
                <AlertTriangle
                  className={`h-6 w-6 ${lowStockCount + outOfStockCount > 0 ? "text-amber-600" : "text-muted-foreground"}`}
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Needs Attention</p>
                <p className="text-2xl font-bold">{lowStockCount + outOfStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or barcode..."
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
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="ok">In Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Stock ({filteredProducts.length} products)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Min Level</TableHead>
                  <TableHead className="text-right">Purchase</TableHead>
                  <TableHead className="text-right">Stock Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.barcode || "No barcode"}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {product.currentStock} {product.unit}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{product.minStockLevel}</TableCell>
                      <TableCell className="text-right">₹{product.purchasePrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{(product.currentStock * product.purchasePrice).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {product.currentStock === 0 ? (
                          <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>
                        ) : product.currentStock <= product.minStockLevel ? (
                          <Badge className="bg-amber-100 text-amber-800">Low Stock</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">In Stock</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
