"use client"

import { useSalesStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function TopProducts() {
  const { getTodaySales } = useSalesStore()
  const todaySales = getTodaySales()

  // Aggregate products sold today
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {}

  todaySales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          name: item.productName,
          quantity: 0,
          revenue: 0,
        }
      }
      productSales[item.productId].quantity += item.quantity
      productSales[item.productId].revenue += item.subtotal
    })
  })

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Selling Today</CardTitle>
      </CardHeader>
      <CardContent>
        {topProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No products sold today yet.</div>
        ) : (
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.quantity} sold</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">
                    ₹{product.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
