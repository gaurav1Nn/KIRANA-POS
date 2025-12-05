"use client"

import { useState } from "react"
import { useCartStore, useProductStore, useSalesStore, useAuthStore, useSettingsStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Percent, IndianRupee, Banknote, Smartphone, CreditCard, Pause, Trash2, Check, Printer } from "lucide-react"
import type { SaleItem, Sale } from "@/lib/types"

export function CartSummary() {
  const { user } = useAuthStore()
  const { settings } = useSettingsStore()
  const {
    items,
    discount,
    discountType,
    setDiscount,
    clearCart,
    getSubtotal,
    getDiscountAmount,
    getTaxBreakdown,
    getTotal,
  } = useCartStore()
  const { updateProduct } = useProductStore()
  const { addSale, holdBill } = useSalesStore()

  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "card">("cash")
  const [showPayment, setShowPayment] = useState(false)
  const [amountReceived, setAmountReceived] = useState("")
  const [showDiscount, setShowDiscount] = useState(false)
  const [discountInput, setDiscountInput] = useState("")
  const [discountTypeInput, setDiscountTypeInput] = useState<"amount" | "percent">("amount")
  const [saleComplete, setSaleComplete] = useState(false)
  const [lastInvoice, setLastInvoice] = useState("")
  const [lastSale, setLastSale] = useState<Sale | null>(null)

  const subtotal = getSubtotal()
  const discountAmount = getDiscountAmount()
  const tax = getTaxBreakdown()
  const total = getTotal()
  const change = Number.parseFloat(amountReceived) - total

  const handlePrintReceipt = () => {
    if (!lastSale) return

    const receiptWindow = window.open("", "_blank", "width=300,height=600")
    if (!receiptWindow) return

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${lastSale.invoiceNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              padding: 10px;
              max-width: 280px;
              margin: 0 auto;
            }
            .header { text-align: center; margin-bottom: 10px; }
            .shop-name { font-size: 16px; font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; }
            .item-row { margin: 4px 0; }
            .item-name { font-weight: bold; }
            .item-details { padding-left: 10px; font-size: 11px; }
            .total-row { font-weight: bold; font-size: 14px; }
            .footer { text-align: center; margin-top: 10px; font-size: 11px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="shop-name">${settings.shopName}</div>
            <div>${settings.addressLine1}</div>
            ${settings.addressLine2 ? `<div>${settings.addressLine2}</div>` : ""}
            <div>${settings.city}, ${settings.state} - ${settings.pincode}</div>
            <div>Ph: ${settings.phone}</div>
            ${settings.gstin ? `<div>GSTIN: ${settings.gstin}</div>` : ""}
          </div>
          
          <div class="divider"></div>
          
          <div class="row">
            <span>Invoice: ${lastSale.invoiceNumber}</span>
          </div>
          <div class="row">
            <span>Date: ${new Date(lastSale.saleDate).toLocaleDateString()}</span>
            <span>${new Date(lastSale.saleDate).toLocaleTimeString()}</span>
          </div>
          <div class="row">
            <span>Payment: ${lastSale.paymentMode.toUpperCase()}</span>
          </div>
          
          <div class="divider"></div>
          
          ${lastSale.items
            .map(
              (item) => `
            <div class="item-row">
              <div class="item-name">${item.productName}</div>
              <div class="item-details">
                <div class="row">
                  <span>${item.quantity} x ₹${item.unitPrice.toFixed(2)}</span>
                  <span>₹${item.subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          `,
            )
            .join("")}
          
          <div class="divider"></div>
          
          <div class="row">
            <span>Subtotal</span>
            <span>₹${lastSale.subtotal.toFixed(2)}</span>
          </div>
          
          ${
            lastSale.discountAmount > 0
              ? `
            <div class="row">
              <span>Discount</span>
              <span>-₹${lastSale.discountAmount.toFixed(2)}</span>
            </div>
          `
              : ""
          }
          
          ${
            settings.showGstBreakdown && lastSale.totalTax > 0
              ? `
            <div class="row">
              <span>CGST</span>
              <span>₹${lastSale.cgstAmount.toFixed(2)}</span>
            </div>
            <div class="row">
              <span>SGST</span>
              <span>₹${lastSale.sgstAmount.toFixed(2)}</span>
            </div>
          `
              : ""
          }
          
          <div class="divider"></div>
          
          <div class="row total-row">
            <span>TOTAL</span>
            <span>₹${lastSale.totalAmount.toFixed(2)}</span>
          </div>
          
          ${
            lastSale.paymentMode === "cash" && lastSale.amountReceived
              ? `
            <div class="row">
              <span>Cash Received</span>
              <span>₹${lastSale.amountReceived.toFixed(2)}</span>
            </div>
            <div class="row">
              <span>Change</span>
              <span>₹${(lastSale.changeReturned || 0).toFixed(2)}</span>
            </div>
          `
              : ""
          }
          
          <div class="divider"></div>
          
          <div class="footer">
            ${settings.receiptHeader ? `<div>${settings.receiptHeader}</div>` : ""}
            <div style="margin-top: 5px;">${settings.receiptFooter}</div>
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 8px 16px; cursor: pointer;">
              Print Receipt
            </button>
          </div>
          
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `

    receiptWindow.document.write(receiptHtml)
    receiptWindow.document.close()
  }

  const handleApplyDiscount = () => {
    const value = Number.parseFloat(discountInput) || 0
    setDiscount(value, discountTypeInput)
    setShowDiscount(false)
    setDiscountInput("")
  }

  const handleHoldBill = () => {
    if (items.length === 0) return
    holdBill({
      billName: `Bill ${new Date().toLocaleTimeString()}`,
      items: items,
      subtotal: subtotal,
      discount: discountAmount,
      heldBy: user?.id || "",
    })
    clearCart()
  }

  const handleCompleteSale = () => {
    if (items.length === 0) return

    // Create sale items
    const saleItems: SaleItem[] = items.map((item) => ({
      id: Math.random().toString(36).substr(2, 9),
      productId: item.id,
      productName: item.name,
      barcode: item.barcode,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.sellingPrice,
      discount: item.discount,
      gstRate: item.gstRate,
      gstAmount: (item.sellingPrice * item.quantity * item.gstRate) / 100,
      subtotal: item.sellingPrice * item.quantity,
    }))

    // Create sale
    const sale = addSale({
      items: saleItems,
      subtotal: subtotal,
      discountAmount: discountAmount,
      discountPercent: discountType === "percent" ? discount : 0,
      cgstAmount: tax.cgst,
      sgstAmount: tax.sgst,
      totalTax: tax.total,
      totalAmount: total,
      paymentMode: paymentMode,
      amountReceived: paymentMode === "cash" ? Number.parseFloat(amountReceived) : total,
      changeReturned: paymentMode === "cash" ? Math.max(0, change) : 0,
      status: "completed",
      createdBy: user?.id || "",
    })

    // Update stock for each item
    items.forEach((item) => {
      updateProduct(item.id, {
        currentStock: item.currentStock - item.quantity,
      })
    })

    setLastInvoice(sale.invoiceNumber)
    setLastSale(sale)
    setSaleComplete(true)
    setShowPayment(false)
    clearCart()
    setAmountReceived("")
  }

  const handleNewSale = () => {
    setSaleComplete(false)
    setLastInvoice("")
    setLastSale(null)
  }

  return (
    <>
      <div className="border-t border-border bg-card p-4 space-y-4">
        {/* Summary Rows */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-₹{discountAmount.toFixed(2)}</span>
            </div>
          )}

          {settings.showGstBreakdown && tax.total > 0 && (
            <>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>CGST</span>
                <span>₹{tax.cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>SGST</span>
                <span>₹{tax.sgst.toFixed(2)}</span>
              </div>
            </>
          )}

          <div className="flex justify-between text-2xl font-bold pt-2 border-t border-border">
            <span>Total</span>
            <span className="text-primary">₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={() => setShowDiscount(true)}
            disabled={items.length === 0}
          >
            <Percent className="h-4 w-4" />
            Discount
          </Button>
          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={handleHoldBill}
            disabled={items.length === 0}
          >
            <Pause className="h-4 w-4" />
            Hold
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-destructive hover:text-destructive bg-transparent"
            onClick={clearCart}
            disabled={items.length === 0}
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        </div>

        {/* Payment Mode Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={paymentMode === "cash" ? "default" : "outline"}
            className="gap-2"
            onClick={() => setPaymentMode("cash")}
          >
            <Banknote className="h-4 w-4" />
            Cash
          </Button>
          <Button
            variant={paymentMode === "upi" ? "default" : "outline"}
            className="gap-2"
            onClick={() => setPaymentMode("upi")}
          >
            <Smartphone className="h-4 w-4" />
            UPI
          </Button>
          <Button
            variant={paymentMode === "card" ? "default" : "outline"}
            className="gap-2"
            onClick={() => setPaymentMode("card")}
          >
            <CreditCard className="h-4 w-4" />
            Card
          </Button>
        </div>

        {/* Complete Sale Button */}
        <Button
          size="lg"
          className="w-full h-14 text-lg font-bold gap-2"
          onClick={() => (paymentMode === "cash" ? setShowPayment(true) : handleCompleteSale())}
          disabled={items.length === 0}
        >
          <Check className="h-5 w-5" />
          Complete Sale (F12)
        </Button>
      </div>

      {/* Payment Dialog for Cash */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cash Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-4xl font-bold text-primary">₹{total.toFixed(2)}</p>
            </div>

            <div className="space-y-2">
              <Label>Amount Received</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="text-xl h-14 text-center"
                autoFocus
              />
            </div>

            {Number.parseFloat(amountReceived) >= total && (
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600">Change to Return</p>
                <p className="text-3xl font-bold text-green-600">₹{change.toFixed(2)}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              {[
                total,
                Math.ceil(total / 10) * 10,
                Math.ceil(total / 50) * 50,
                Math.ceil(total / 100) * 100,
                500,
                1000,
              ].map((amount) => (
                <Button key={amount} variant="outline" onClick={() => setAmountReceived(amount.toString())}>
                  ₹{amount}
                </Button>
              ))}
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={handleCompleteSale}
              disabled={Number.parseFloat(amountReceived) < total}
            >
              Complete Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discount Dialog */}
      <Dialog open={showDiscount} onOpenChange={setShowDiscount}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                variant={discountTypeInput === "amount" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setDiscountTypeInput("amount")}
              >
                <IndianRupee className="h-4 w-4" />
                Amount
              </Button>
              <Button
                variant={discountTypeInput === "percent" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setDiscountTypeInput("percent")}
              >
                <Percent className="h-4 w-4" />
                Percent
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Discount {discountTypeInput === "percent" ? "%" : "₹"}</Label>
              <Input
                type="number"
                placeholder={`Enter ${discountTypeInput}`}
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                className="text-xl h-12"
                autoFocus
              />
            </div>

            <Button className="w-full" onClick={handleApplyDiscount}>
              Apply Discount
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sale Complete Dialog */}
      <Dialog open={saleComplete} onOpenChange={setSaleComplete}>
        <DialogContent>
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Sale Complete!</h2>
              <p className="text-muted-foreground">Invoice: {lastInvoice}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 bg-transparent gap-2" onClick={handlePrintReceipt}>
                <Printer className="h-4 w-4" />
                Print Receipt
              </Button>
              <Button className="flex-1" onClick={handleNewSale}>
                New Sale
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
