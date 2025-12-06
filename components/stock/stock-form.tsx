"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useProductStore, useSalesStore, useAuthStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PackagePlus, PackageMinus, Settings2, Loader2 } from "lucide-react"

interface StockFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType?: "stock_in" | "stock_out" | "adjustment"
}

export function StockForm({ open, onOpenChange, defaultType = "stock_in" }: StockFormProps) {
  const { user } = useAuthStore()
  const { products, updateProduct } = useProductStore()
  const { addStockMovement } = useSalesStore()

  const [type, setType] = useState<"stock_in" | "stock_out" | "adjustment">(defaultType)
  const [productId, setProductId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [purchasePrice, setPurchasePrice] = useState("")
  const [supplierName, setSupplierName] = useState("")
  const [reason, setReason] = useState("")
  const [newStockLevel, setNewStockLevel] = useState("")
  const [saving, setSaving] = useState(false)

  const activeProducts = products.filter((p) => p.status === "active")
  const selectedProduct = products.find((p) => p.id === productId)

  useEffect(() => {
    if (defaultType) {
      setType(defaultType)
    }
  }, [defaultType, open])

  useEffect(() => {
    if (selectedProduct && type === "adjustment") {
      setNewStockLevel(selectedProduct.currentStock.toString())
    }
  }, [selectedProduct, type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    setSaving(true)
    try {
      const qty = Number.parseFloat(quantity) || 0
      const previousStock = selectedProduct.currentStock
      let newStock = previousStock

      if (type === "stock_in") {
        newStock = previousStock + qty
      } else if (type === "stock_out") {
        newStock = Math.max(0, previousStock - qty)
      } else if (type === "adjustment") {
        newStock = Number.parseFloat(newStockLevel) || 0
      }

      // Log stock movement (this will also update product stock in db.ts)
      await addStockMovement({
        productId,
        productName: selectedProduct.name,
        movementType: type,
        quantity: type === "adjustment" ? Math.abs(newStock - previousStock) : qty,
        reason: reason || undefined,
        purchasePrice: type === "stock_in" ? Number.parseFloat(purchasePrice) || undefined : undefined,
        supplierName: type === "stock_in" ? supplierName || undefined : undefined,
        previousStock,
        newStock,
        createdBy: user?.id || "unknown",
      })

      // Reset form
      setProductId("")
      setQuantity("")
      setPurchasePrice("")
      setSupplierName("")
      setReason("")
      setNewStockLevel("")
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update stock:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Stock Management</DialogTitle>
        </DialogHeader>

        <Tabs value={type} onValueChange={(v) => setType(v as typeof type)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="stock_in" className="gap-2">
              <PackagePlus className="h-4 w-4" />
              Stock In
            </TabsTrigger>
            <TabsTrigger value="stock_out" className="gap-2">
              <PackageMinus className="h-4 w-4" />
              Stock Out
            </TabsTrigger>
            <TabsTrigger value="adjustment" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Adjust
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label>Select Product *</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent>
                  {activeProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} (Stock: {product.currentStock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current Stock Display */}
            {selectedProduct && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Current Stock</p>
                <p className="text-2xl font-bold">
                  {selectedProduct.currentStock} {selectedProduct.unit}
                </p>
              </div>
            )}

            <TabsContent value="stock_in" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label>Quantity to Add *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Purchase Price (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="Enter purchase price"
                />
              </div>
              <div className="space-y-2">
                <Label>Supplier Name</Label>
                <Input
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Enter supplier name"
                />
              </div>
            </TabsContent>

            <TabsContent value="stock_out" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label>Quantity to Remove *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  max={selectedProduct?.currentStock}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Reason *</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="lost">Lost/Missing</SelectItem>
                    <SelectItem value="return">Return to Supplier</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="adjustment" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label>New Stock Level *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newStockLevel}
                  onChange={(e) => setNewStockLevel(e.target.value)}
                  placeholder="Enter correct stock level"
                  min="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Reason for Adjustment</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why is stock being adjusted?"
                  rows={2}
                />
              </div>
            </TabsContent>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!productId || saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {type === "stock_in" ? "Add Stock" : type === "stock_out" ? "Remove Stock" : "Adjust Stock"}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
