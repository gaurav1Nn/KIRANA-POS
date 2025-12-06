"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useProductStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CATEGORIES, UNITS, GST_RATES } from "@/lib/types"
import type { Product } from "@/lib/types"
import { AlertCircle, Loader2 } from "lucide-react"

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
}

export function ProductForm({ open, onOpenChange, product }: ProductFormProps) {
  const { addProduct, updateProduct, checkBarcodeExists } = useProductStore()
  const isEditing = !!product

  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    category: "Groceries",
    unit: "Piece",
    purchasePrice: "",
    sellingPrice: "",
    currentStock: "",
    minStockLevel: "5",
    expiryDate: "",
    gstRate: "0",
    brand: "",
    description: "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [barcodeWarning, setBarcodeWarning] = useState("")

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        barcode: product.barcode || "",
        category: product.category,
        unit: product.unit,
        purchasePrice: product.purchasePrice.toString(),
        sellingPrice: product.sellingPrice.toString(),
        currentStock: product.currentStock.toString(),
        minStockLevel: product.minStockLevel.toString(),
        expiryDate: product.expiryDate ? product.expiryDate.split("T")[0] : "",
        gstRate: product.gstRate.toString(),
        brand: product.brand || "",
        description: product.description || "",
      })
    } else {
      setFormData({
        name: "",
        barcode: "",
        category: "Groceries",
        unit: "Piece",
        purchasePrice: "",
        sellingPrice: "",
        currentStock: "",
        minStockLevel: "5",
        expiryDate: "",
        gstRate: "0",
        brand: "",
        description: "",
      })
    }
    setError("")
    setBarcodeWarning("")
  }, [product, open])

  const handleBarcodeChange = async (barcode: string) => {
    setFormData({ ...formData, barcode })
    setBarcodeWarning("")

    if (barcode && barcode.length >= 8) {
      try {
        const exists = await checkBarcodeExists(barcode, product?.id)
        if (exists) {
          setBarcodeWarning("This barcode is already assigned to another product")
        }
      } catch (err) {
        console.error("Failed to check barcode:", err)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)

    const productData = {
      name: formData.name,
      barcode: formData.barcode || undefined,
      category: formData.category,
      unit: formData.unit,
      purchasePrice: Number.parseFloat(formData.purchasePrice) || 0,
      sellingPrice: Number.parseFloat(formData.sellingPrice) || 0,
      currentStock: Number.parseFloat(formData.currentStock) || 0,
      minStockLevel: Number.parseFloat(formData.minStockLevel) || 5,
      expiryDate: formData.expiryDate || undefined,
      gstRate: Number.parseFloat(formData.gstRate) || 0,
      brand: formData.brand || undefined,
      description: formData.description || undefined,
      status: "active" as const,
    }

    try {
      if (isEditing && product) {
        await updateProduct(product.id, productData)
      } else {
        await addProduct(productData)
      }
      onOpenChange(false)
    } catch (err) {
      setError("Failed to save product. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter product name"
                required
              />
            </div>

            {/* Barcode */}
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode/EAN</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => handleBarcodeChange(e.target.value)}
                placeholder="Scan or enter barcode"
              />
              {barcodeWarning && <p className="text-sm text-amber-600">{barcodeWarning}</p>}
            </div>

            {/* Brand */}
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Brand name"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unit */}
            <div className="space-y-2">
              <Label>Unit *</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Purchase Price */}
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price (₹) *</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            {/* Selling Price */}
            <div className="space-y-2">
              <Label htmlFor="sellingPrice">Selling Price/MRP (₹) *</Label>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            {/* Current Stock */}
            <div className="space-y-2">
              <Label htmlFor="currentStock">Current Stock</Label>
              <Input
                id="currentStock"
                type="number"
                step="0.01"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                placeholder="0"
              />
            </div>

            {/* Min Stock Level */}
            <div className="space-y-2">
              <Label htmlFor="minStockLevel">Min Stock Level</Label>
              <Input
                id="minStockLevel"
                type="number"
                step="0.01"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                placeholder="5"
              />
            </div>

            {/* GST Rate */}
            <div className="space-y-2">
              <Label>GST Rate (%)</Label>
              <Select value={formData.gstRate} onValueChange={(value) => setFormData({ ...formData, gstRate: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GST_RATES.map((rate) => (
                    <SelectItem key={rate} value={rate.toString()}>
                      {rate}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional product description"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Update Product" : "Add Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
