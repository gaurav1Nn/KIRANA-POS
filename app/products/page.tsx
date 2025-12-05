"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { Sidebar } from "@/components/sidebar"
import { ProductList } from "@/components/products/product-list"
import { ProductForm } from "@/components/products/product-form"
import type { Product } from "@/lib/types"

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  // Check for action param
  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setShowForm(true)
    }
  }, [searchParams])

  if (!user) {
    return null
  }

  const handleAdd = () => {
    setEditingProduct(null)
    setShowForm(true)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground">Manage your product inventory</p>
          </div>

          {/* Product List */}
          <ProductList onAdd={handleAdd} onEdit={handleEdit} />

          {/* Product Form Dialog */}
          <ProductForm open={showForm} onOpenChange={setShowForm} product={editingProduct} />
        </div>
      </main>
    </div>
  )
}
