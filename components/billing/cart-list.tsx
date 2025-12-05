"use client"

import { useCartStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Minus, Plus, Trash2 } from "lucide-react"

export function CartList() {
  const { items, updateQuantity, removeItem } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-1">Cart is empty</p>
          <p className="text-sm">Scan or search to add products</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full">
        <thead className="bg-muted/50 sticky top-0">
          <tr className="text-left text-sm text-muted-foreground">
            <th className="p-3 font-medium">Item</th>
            <th className="p-3 font-medium text-center w-32">Qty</th>
            <th className="p-3 font-medium text-right w-24">Price</th>
            <th className="p-3 font-medium text-right w-28">Subtotal</th>
            <th className="p-3 w-12"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-muted/30">
              <td className="p-3">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.barcode || "No barcode"} • {item.unit}
                </p>
              </td>
              <td className="p-3">
                <div className="flex items-center justify-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-transparent"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, Number.parseInt(e.target.value) || 0)}
                    className="w-14 h-8 text-center p-1"
                    min={1}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-transparent"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </td>
              <td className="p-3 text-right font-medium">₹{item.sellingPrice.toFixed(2)}</td>
              <td className="p-3 text-right font-bold">₹{(item.sellingPrice * item.quantity).toFixed(2)}</td>
              <td className="p-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
