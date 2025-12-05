"use client"

import { useState } from "react"
import { useSalesStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { IndianRupee, Receipt, TrendingUp, Wallet, CreditCard, Smartphone } from "lucide-react"
import { format, startOfDay, endOfDay, subDays } from "date-fns"

export function SalesSummary() {
  const { sales, getSalesByDateRange } = useSalesStore()
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))

  const filteredSales = getSalesByDateRange(startOfDay(new Date(startDate)), endOfDay(new Date(endDate)))

  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
  const totalBills = filteredSales.length
  const avgBillValue = totalBills > 0 ? totalSales / totalBills : 0

  const cashSales = filteredSales.filter((s) => s.paymentMode === "cash")
  const upiSales = filteredSales.filter((s) => s.paymentMode === "upi")
  const cardSales = filteredSales.filter((s) => s.paymentMode === "card")

  const cashTotal = cashSales.reduce((sum, s) => sum + s.totalAmount, 0)
  const upiTotal = upiSales.reduce((sum, s) => sum + s.totalAmount, 0)
  const cardTotal = cardSales.reduce((sum, s) => sum + s.totalAmount, 0)

  const setQuickRange = (days: number) => {
    const end = new Date()
    const start = subDays(end, days - 1)
    setStartDate(format(start, "yyyy-MM-dd"))
    setEndDate(format(end, "yyyy-MM-dd"))
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
              <Button variant="outline" size="sm" onClick={() => setQuickRange(1)}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange(7)}>
                7 Days
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange(30)}>
                30 Days
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
            <IndianRupee className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{totalSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bills</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBills}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Bill Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{avgBillValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
            <Receipt className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredSales.reduce(
                (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
                0,
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Mode Breakdown */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cash ({cashSales.length} bills)</p>
                <p className="text-xl font-bold">₹{cashTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <Smartphone className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">UPI ({upiSales.length} bills)</p>
                <p className="text-xl font-bold">₹{upiTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Card ({cardSales.length} bills)</p>
                <p className="text-xl font-bold">₹{cardTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No sales in selected date range
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales
                    .slice()
                    .reverse()
                    .map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">{sale.invoiceNumber}</TableCell>
                        <TableCell>
                          {format(new Date(sale.saleDate), "dd MMM yyyy")}
                          <br />
                          <span className="text-muted-foreground text-sm">
                            {format(new Date(sale.saleDate), "hh:mm a")}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{sale.items.length}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              sale.paymentMode === "cash"
                                ? "bg-green-100 text-green-800"
                                : sale.paymentMode === "upi"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-purple-100 text-purple-800"
                            }
                          >
                            {sale.paymentMode.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          ₹{sale.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
