"use client"

import { useSalesStore, useProductStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IndianRupee, Receipt, ShoppingBag, Wallet, CreditCard, TrendingUp, AlertTriangle, Clock } from "lucide-react"

export function StatsCards() {
  const { getTodaySales } = useSalesStore()
  const { getLowStockProducts, getExpiringProducts } = useProductStore()

  const todaySales = getTodaySales()
  const lowStockCount = getLowStockProducts().length
  const expiringCount = getExpiringProducts(7).length

  const totalSales = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0)
  const totalBills = todaySales.length
  const totalItems = todaySales.reduce(
    (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  )
  const cashSales = todaySales.filter((s) => s.paymentMode === "cash").reduce((sum, s) => sum + s.totalAmount, 0)
  const digitalSales = todaySales.filter((s) => s.paymentMode !== "cash").reduce((sum, s) => sum + s.totalAmount, 0)
  const avgBillValue = totalBills > 0 ? totalSales / totalBills : 0

  const stats = [
    {
      title: "Today's Sales",
      value: `₹${totalSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      icon: IndianRupee,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Total Bills",
      value: totalBills.toString(),
      icon: Receipt,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Items Sold",
      value: totalItems.toString(),
      icon: ShoppingBag,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Cash Sales",
      value: `₹${cashSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      icon: Wallet,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "UPI/Card Sales",
      value: `₹${digitalSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      icon: CreditCard,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Avg Bill Value",
      value: `₹${avgBillValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
  ]

  const alerts = [
    {
      title: "Low Stock Items",
      value: lowStockCount,
      icon: AlertTriangle,
      color: lowStockCount > 0 ? "text-amber-600" : "text-muted-foreground",
      bgColor: lowStockCount > 0 ? "bg-amber-100" : "bg-muted",
    },
    {
      title: "Expiring Soon",
      value: expiringCount,
      icon: Clock,
      color: expiringCount > 0 ? "text-red-600" : "text-muted-foreground",
      bgColor: expiringCount > 0 ? "bg-red-100" : "bg-muted",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Sales Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      <div className="grid gap-4 sm:grid-cols-2">
        {alerts.map((alert) => (
          <Card key={alert.title} className={alert.value > 0 ? "border-amber-200" : ""}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`p-3 rounded-lg ${alert.bgColor}`}>
                <alert.icon className={`h-6 w-6 ${alert.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{alert.title}</p>
                <p className="text-3xl font-bold">{alert.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
