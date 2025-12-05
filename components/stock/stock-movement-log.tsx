"use client"

import { useState } from "react"
import { useSalesStore } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, ArrowUpCircle, ArrowDownCircle, Settings2 } from "lucide-react"
import { format } from "date-fns"

export function StockMovementLog() {
  const { stockMovements } = useSalesStore()
  const [search, setSearch] = useState("")

  const filteredMovements = stockMovements
    .filter((m) => search === "" || m.productName.toLowerCase().includes(search.toLowerCase()))
    .slice()
    .reverse()
    .slice(0, 50)

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "stock_in":
        return <ArrowUpCircle className="h-4 w-4 text-green-600" />
      case "stock_out":
        return <ArrowDownCircle className="h-4 w-4 text-red-600" />
      default:
        return <Settings2 className="h-4 w-4 text-blue-600" />
    }
  }

  const getMovementBadge = (type: string) => {
    switch (type) {
      case "stock_in":
        return <Badge className="bg-green-100 text-green-800">Stock In</Badge>
      case "stock_out":
        return <Badge className="bg-red-100 text-red-800">Stock Out</Badge>
      default:
        return <Badge className="bg-blue-100 text-blue-800">Adjustment</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Stock Movement Log</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Before</TableHead>
              <TableHead className="text-right">After</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No stock movements recorded
                </TableCell>
              </TableRow>
            ) : (
              filteredMovements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="text-sm">
                    {format(new Date(movement.createdAt), "dd MMM yyyy")}
                    <br />
                    <span className="text-muted-foreground">{format(new Date(movement.createdAt), "hh:mm a")}</span>
                  </TableCell>
                  <TableCell className="font-medium">{movement.productName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getMovementIcon(movement.movementType)}
                      {getMovementBadge(movement.movementType)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {movement.movementType === "stock_in" ? "+" : movement.movementType === "stock_out" ? "-" : ""}
                    {movement.quantity}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{movement.previousStock}</TableCell>
                  <TableCell className="text-right font-medium">{movement.newStock}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {movement.reason || "-"}
                    {movement.supplierName && <span className="block">Supplier: {movement.supplierName}</span>}
                  </TableCell>
                  <TableCell className="text-sm">{movement.createdBy}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
