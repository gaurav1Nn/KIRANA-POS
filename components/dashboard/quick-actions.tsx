"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Plus, PackagePlus, BarChart3 } from "lucide-react"

export function QuickActions() {
  const actions = [
    {
      title: "New Sale",
      description: "Start billing a customer",
      href: "/billing",
      icon: ShoppingCart,
      variant: "default" as const,
    },
    {
      title: "Add Product",
      description: "Add a new product",
      href: "/products?action=add",
      icon: Plus,
      variant: "outline" as const,
    },
    {
      title: "Stock In",
      description: "Add stock to products",
      href: "/stock?action=in",
      icon: PackagePlus,
      variant: "outline" as const,
    },
    {
      title: "View Reports",
      description: "Check sales reports",
      href: "/reports",
      icon: BarChart3,
      variant: "outline" as const,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Button variant={action.variant} className="w-full h-auto flex-col items-center gap-2 py-4">
                <action.icon className="h-6 w-6" />
                <div className="text-center">
                  <p className="font-medium">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
