"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { StockForm } from "@/components/stock/stock-form"
import { StockAlerts } from "@/components/stock/stock-alerts"
import { StockMovementLog } from "@/components/stock/stock-movement-log"
import { PackagePlus, PackageMinus, Settings2 } from "lucide-react"

export default function StockPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<"stock_in" | "stock_out" | "adjustment">("stock_in")

  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  // Check for action param
  useEffect(() => {
    const action = searchParams.get("action")
    if (action === "in") {
      setFormType("stock_in")
      setShowForm(true)
    } else if (action === "out") {
      setFormType("stock_out")
      setShowForm(true)
    }
  }, [searchParams])

  if (!user) {
    return null
  }

  const openForm = (type: "stock_in" | "stock_out" | "adjustment") => {
    setFormType(type)
    setShowForm(true)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Stock Management</h1>
              <p className="text-muted-foreground">Track and manage your inventory</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => openForm("stock_in")} className="gap-2">
                <PackagePlus className="h-4 w-4" />
                Stock In
              </Button>
              <Button onClick={() => openForm("stock_out")} variant="outline" className="gap-2">
                <PackageMinus className="h-4 w-4" />
                Stock Out
              </Button>
              <Button onClick={() => openForm("adjustment")} variant="outline" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Adjust
              </Button>
            </div>
          </div>

          {/* Stock Alerts */}
          <StockAlerts />

          {/* Stock Movement Log */}
          <StockMovementLog />

          {/* Stock Form Dialog */}
          <StockForm open={showForm} onOpenChange={setShowForm} defaultType={formType} />
        </div>
      </main>
    </div>
  )
}
