"use client"

import { useSalesStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export function RecentSales() {
  const { getTodaySales } = useSalesStore()
  const recentSales = getTodaySales().slice(-10).reverse()

  const paymentModeColors = {
    cash: "bg-green-100 text-green-800",
    upi: "bg-blue-100 text-blue-800",
    card: "bg-purple-100 text-purple-800",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
      </CardHeader>
      <CardContent>
        {recentSales.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No sales today yet. Start a new sale!</div>
        ) : (
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">{sale.invoiceNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(sale.saleDate), "hh:mm a")} • {sale.items.length} items
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₹{sale.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                  <Badge variant="secondary" className={paymentModeColors[sale.paymentMode]}>
                    {sale.paymentMode.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
