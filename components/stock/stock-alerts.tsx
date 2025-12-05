"use client"

import { useProductStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock } from "lucide-react"
import { format, differenceInDays } from "date-fns"

export function StockAlerts() {
  const { getLowStockProducts, getExpiringProducts } = useProductStore()

  const lowStockProducts = getLowStockProducts()
  const expiringProducts = getExpiringProducts(30)

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Low Stock Alert */}
      <Card className={lowStockProducts.length > 0 ? "border-amber-200" : ""}>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className={`p-2 rounded-lg ${lowStockProducts.length > 0 ? "bg-amber-100" : "bg-muted"}`}>
            <AlertTriangle
              className={`h-5 w-5 ${lowStockProducts.length > 0 ? "text-amber-600" : "text-muted-foreground"}`}
            />
          </div>
          <div>
            <CardTitle className="text-lg">Low Stock Alerts</CardTitle>
            <p className="text-sm text-muted-foreground">{lowStockProducts.length} products need restock</p>
          </div>
        </CardHeader>
        <CardContent>
          {lowStockProducts.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">All products are well stocked</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-auto">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Min: {product.minStockLevel} {product.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                      {product.currentStock} left
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Need: {Math.max(0, product.minStockLevel - product.currentStock + 10)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expiry Alert */}
      <Card className={expiringProducts.length > 0 ? "border-red-200" : ""}>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className={`p-2 rounded-lg ${expiringProducts.length > 0 ? "bg-red-100" : "bg-muted"}`}>
            <Clock className={`h-5 w-5 ${expiringProducts.length > 0 ? "text-red-600" : "text-muted-foreground"}`} />
          </div>
          <div>
            <CardTitle className="text-lg">Expiry Alerts</CardTitle>
            <p className="text-sm text-muted-foreground">{expiringProducts.length} products expiring soon</p>
          </div>
        </CardHeader>
        <CardContent>
          {expiringProducts.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No products expiring soon</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-auto">
              {expiringProducts.map((product) => {
                const daysLeft = differenceInDays(new Date(product.expiryDate!), new Date())
                const isExpired = daysLeft < 0
                return (
                  <div
                    key={product.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${isExpired ? "bg-red-50" : "bg-orange-50"}`}
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Stock: {product.currentStock} {product.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={
                          isExpired
                            ? "bg-red-100 text-red-800 border-red-300"
                            : "bg-orange-100 text-orange-800 border-orange-300"
                        }
                      >
                        {isExpired ? "Expired" : `${daysLeft} days left`}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(product.expiryDate!), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
