"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore, useSettingsStore } from "@/lib/store"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Store, Receipt, Package, Bell, Save } from "lucide-react"
import { useState } from "react"

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { settings, fetchSettings, updateSettings } = useSettingsStore()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState(settings)

  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    setFormData(settings)
  }, [settings])

  if (!user) {
    return null
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSettings(formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error("Failed to save settings:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">Configure your shop and billing preferences</p>
            </div>
            <Button onClick={handleSave} className="gap-2" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </Button>
          </div>

          {/* Settings Tabs */}
          <Tabs defaultValue="shop" className="space-y-6">
            <TabsList>
              <TabsTrigger value="shop" className="gap-2">
                <Store className="h-4 w-4" />
                Shop Details
              </TabsTrigger>
              <TabsTrigger value="billing" className="gap-2">
                <Receipt className="h-4 w-4" />
                Billing
              </TabsTrigger>
              <TabsTrigger value="stock" className="gap-2">
                <Package className="h-4 w-4" />
                Stock
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                Alerts
              </TabsTrigger>
            </TabsList>

            {/* Shop Settings */}
            <TabsContent value="shop">
              <Card>
                <CardHeader>
                  <CardTitle>Shop Information</CardTitle>
                  <CardDescription>This information will appear on your receipts and invoices</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="shopName">Shop Name</Label>
                      <Input
                        id="shopName"
                        value={formData.shopName}
                        onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                        placeholder="My Kirana Store"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="9876543210"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine1">Address Line 1</Label>
                      <Input
                        id="addressLine1"
                        value={formData.addressLine1}
                        onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine2">Address Line 2</Label>
                      <Input
                        id="addressLine2"
                        value={formData.addressLine2}
                        onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                        placeholder="Near Bus Stand"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Mumbai"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="Maharashtra"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode">Pincode</Label>
                      <Input
                        id="pincode"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        placeholder="400001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (Optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="shop@example.com"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="gstin">GSTIN (Optional)</Label>
                      <Input
                        id="gstin"
                        value={formData.gstin}
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                        placeholder="27XXXXX1234X1Z5"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Receipt Customization</CardTitle>
                  <CardDescription>Customize the header and footer text for your receipts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="receiptHeader">Receipt Header Text</Label>
                    <Input
                      id="receiptHeader"
                      value={formData.receiptHeader}
                      onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
                      placeholder="Welcome!"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="receiptFooter">Receipt Footer Text</Label>
                    <Input
                      id="receiptFooter"
                      value={formData.receiptFooter}
                      onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                      placeholder="Thank you! Visit again!"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Settings */}
            <TabsContent value="billing">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Settings</CardTitle>
                  <CardDescription>Configure how invoices are generated</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                      <Input
                        id="invoicePrefix"
                        value={formData.invoicePrefix}
                        onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                        placeholder="INV"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startingInvoiceNumber">Starting Invoice Number</Label>
                      <Input
                        id="startingInvoiceNumber"
                        type="number"
                        value={formData.startingInvoiceNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, startingInvoiceNumber: Number.parseInt(e.target.value) || 1 })
                        }
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxDiscountPercent">Max Discount (%)</Label>
                      <Input
                        id="maxDiscountPercent"
                        type="number"
                        value={formData.maxDiscountPercent}
                        onChange={(e) =>
                          setFormData({ ...formData, maxDiscountPercent: Number.parseInt(e.target.value) || 50 })
                        }
                        placeholder="50"
                        max={100}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Tax Inclusive Pricing</Label>
                        <p className="text-sm text-muted-foreground">MRP includes GST (recommended for kirana)</p>
                      </div>
                      <Switch
                        checked={formData.taxInclusive}
                        onCheckedChange={(checked) => setFormData({ ...formData, taxInclusive: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Discount</Label>
                        <p className="text-sm text-muted-foreground">Allow discounts on bills</p>
                      </div>
                      <Switch
                        checked={formData.enableDiscount}
                        onCheckedChange={(checked) => setFormData({ ...formData, enableDiscount: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show GST Breakdown</Label>
                        <p className="text-sm text-muted-foreground">Display CGST/SGST on receipts</p>
                      </div>
                      <Switch
                        checked={formData.showGstBreakdown}
                        onCheckedChange={(checked) => setFormData({ ...formData, showGstBreakdown: checked })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stock Settings */}
            <TabsContent value="stock">
              <Card>
                <CardHeader>
                  <CardTitle>Stock Management</CardTitle>
                  <CardDescription>Configure stock tracking preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="lowStockThreshold">Default Low Stock Threshold</Label>
                      <Input
                        id="lowStockThreshold"
                        type="number"
                        value={formData.lowStockThreshold}
                        onChange={(e) =>
                          setFormData({ ...formData, lowStockThreshold: Number.parseInt(e.target.value) || 10 })
                        }
                        placeholder="10"
                      />
                      <p className="text-xs text-muted-foreground">Products below this quantity trigger alerts</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiryAlertDays">Expiry Alert Days</Label>
                      <Input
                        id="expiryAlertDays"
                        type="number"
                        value={formData.expiryAlertDays}
                        onChange={(e) =>
                          setFormData({ ...formData, expiryAlertDays: Number.parseInt(e.target.value) || 7 })
                        }
                        placeholder="7"
                      />
                      <p className="text-xs text-muted-foreground">Days before expiry to show warning</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Alert Preferences</CardTitle>
                  <CardDescription>Configure when and how you receive alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Alerts are shown on the dashboard. Low stock and expiry alerts are automatically calculated
                        based on your stock settings.
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Low Stock Alerts</h4>
                        <p className="text-sm text-muted-foreground">
                          Triggered when product stock falls below the minimum level
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Expiry Alerts</h4>
                        <p className="text-sm text-muted-foreground">
                          Triggered {formData.expiryAlertDays} days before product expiry
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
