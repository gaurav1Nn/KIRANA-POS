"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { Sidebar } from "@/components/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesSummary } from "@/components/reports/sales-summary"
import { ProductPerformance } from "@/components/reports/product-performance"
import { StockReport } from "@/components/reports/stock-report"
import { BarChart3, TrendingUp, Package } from "lucide-react"

export default function ReportsPage() {
  const router = useRouter()
  const { user, isOwner } = useAuthStore()

  useEffect(() => {
    if (!user) {
      router.push("/")
    } else if (!isOwner()) {
      router.push("/dashboard")
    }
  }, [user, isOwner, router])

  if (!user || !isOwner()) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground">View sales reports and business insights</p>
          </div>

          {/* Report Tabs */}
          <Tabs defaultValue="sales" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="sales" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Sales
              </TabsTrigger>
              <TabsTrigger value="products" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Products
              </TabsTrigger>
              <TabsTrigger value="stock" className="gap-2">
                <Package className="h-4 w-4" />
                Stock
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sales">
              <SalesSummary />
            </TabsContent>

            <TabsContent value="products">
              <ProductPerformance />
            </TabsContent>

            <TabsContent value="stock">
              <StockReport />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
