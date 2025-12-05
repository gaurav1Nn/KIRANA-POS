"use client"

import { useSalesStore, useCartStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Pause, Clock, Trash2 } from "lucide-react"
import { format } from "date-fns"

export function HeldBills() {
  const { heldBills, resumeBill, deleteHeldBill } = useSalesStore()
  const { items, clearCart } = useCartStore()
  const cartStore = useCartStore()

  const handleResume = (billId: string) => {
    const bill = resumeBill(billId)
    if (bill) {
      // Clear current cart and load held bill items
      clearCart()
      bill.items.forEach((item) => {
        cartStore.addItem(item, item.quantity - 1) // -1 because addItem adds 1 by default
      })
      if (bill.discount > 0) {
        cartStore.setDiscount(bill.discount, "amount")
      }
    }
  }

  if (heldBills.length === 0) {
    return null
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Pause className="h-4 w-4" />
          Held Bills ({heldBills.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Held Bills</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-96 overflow-auto">
          {heldBills.map((bill) => (
            <div key={bill.id} className="p-4 border border-border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium">{bill.billName || "Unnamed Bill"}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(bill.heldAt), "hh:mm a")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => deleteHeldBill(bill.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground mb-3">
                {bill.items.length} items • ₹{bill.subtotal.toFixed(2)}
              </div>
              <Button size="sm" className="w-full" onClick={() => handleResume(bill.id)}>
                Resume Bill
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
