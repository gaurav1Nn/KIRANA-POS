"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { Sidebar } from "@/components/sidebar"
import { ProductSearch } from "@/components/billing/product-search"
import { CartList } from "@/components/billing/cart-list"
import { CartSummary } from "@/components/billing/cart-summary"
import { CategoryShortcuts } from "@/components/billing/category-shortcuts"
import { HeldBills } from "@/components/billing/held-bills"

export default function BillingPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Clear cart handled in cart store
      }
      if (e.key === "F12") {
        e.preventDefault()
        // Trigger complete sale - handled by button
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h1 className="text-2xl font-bold">New Sale</h1>
          <HeldBills />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side - Cart (60%) */}
          <div className="w-3/5 flex flex-col border-r border-border">
            {/* Search */}
            <div className="p-4 border-b border-border">
              <ProductSearch />
            </div>

            {/* Cart List */}
            <CartList />

            {/* Cart Summary */}
            <CartSummary />
          </div>

          {/* Right Side - Categories & Products (40%) */}
          <div className="w-2/5 flex flex-col bg-muted/30">
            <CategoryShortcuts />
          </div>
        </div>
      </main>
    </div>
  )
}
