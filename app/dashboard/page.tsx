"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { Sidebar } from "@/components/sidebar"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentSales } from "@/components/dashboard/recent-sales"
import { TopProducts } from "@/components/dashboard/top-products"

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.fullName}! Here's your store overview.</p>
          </div>

          {/* Stats Cards */}
          <StatsCards />

          {/* Quick Actions */}
          <QuickActions />

          {/* Recent Sales & Top Products */}
          <div className="grid gap-6 lg:grid-cols-2">
            <RecentSales />
            <TopProducts />
          </div>
        </div>
      </main>
    </div>
  )
}
