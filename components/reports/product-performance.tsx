"use client"

import { useState, useEffect } from "react"
import { useSalesStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { format, startOfDay, endOfDay, subDays } from "date-fns"

export function ProductPerformance() {
  const { fetchSales, isLoading, getSalesByDateRange } = useSalesStore()
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 29), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const init = async () => {
      await fetchSales()
      setIsInitialized(true)
    }
    init()
  }, [fetchSales])

  const filteredSales = isInitialized
    ? getSalesByDateRange(startOfDay(new Date(startDate)), endOfDay(new Date(endDate)))
    : []

  // Aggregate product performance
  const productStats: Record<
    string,
    {
      name: string
      quantity: number
      revenue: number
      category?: string
    }
  > = {}

  filteredSales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (!productStats[item.productId]) {
        productStats[item.productId] = {
          name: item.productName,
          quantity: 0,
          revenue: 0,
        }
      }
      productStats[item.productId].quantity += item.quantity
      productStats[item.productId].revenue += item.subtotal
    })
  })

  const topByQuantity = Object.entries(productStats)
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 20)

  const topByRevenue = Object.entries(productStats)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 20)

  const setQuickRange = (days: number) => {
    const end = new Date()
    const start = subDays(end, days - 1)
    setStartDate(format(start, "yyyy-MM-dd"))
    setEndDate(format(end, "yyyy-MM-dd"))
  }

  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setQuickRange(7)}>
                7 Days
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange(30)}>
                30 Days
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange(90)}>
                90 Days
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products by Quantity */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Quantity Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-auto">
              {topByQuantity.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No data available</p>
              ) : (
                topByQuantity.map(([id, stats], index) => (
                  <div key={id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{stats.name}</p>
                      <p className="text-sm text-muted-foreground">{stats.quantity} units sold</p>
                    </div>
                    <Badge variant="secondary">
                      ₹{stats.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products by Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-auto">
              {topByRevenue.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No data available</p>
              ) : (
                topByRevenue.map(([id, stats], index) => (
                  <div key={id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{stats.name}</p>
                      <p className="text-sm text-muted-foreground">{stats.quantity} units sold</p>
                    </div>
                    <span className="font-bold text-emerald-600">
                      ₹{stats.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
