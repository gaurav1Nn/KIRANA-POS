"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, Users, Shield, User, Loader2 } from "lucide-react"
import { format } from "date-fns"
import * as db from "@/lib/db"
import type { User as UserType } from "@/lib/types"

export default function UsersPage() {
  const router = useRouter()
  const { user, isOwner } = useAuthStore()
  const [showForm, setShowForm] = useState(false)
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    password: "staff123",
    role: "staff" as "owner" | "staff",
  })

  useEffect(() => {
    if (!user) {
      router.push("/")
    } else if (!isOwner()) {
      router.push("/dashboard")
    }
  }, [user, isOwner, router])

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true)
      try {
        const data = await db.getUsers()
        // Map DB format to our type format
        setUsers(
          data.map((u: Record<string, unknown>) => ({
            id: u.id as string,
            username: u.username as string,
            fullName: (u.full_name || u.fullName) as string,
            role: u.role as "owner" | "staff",
            status: u.status as "active" | "inactive",
            createdAt: (u.created_at || u.createdAt) as string,
            lastLogin: (u.last_login || u.lastLogin) as string | undefined,
          })),
        )
      } catch (error) {
        console.error("Failed to load users:", error)
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [])

  if (!user || !isOwner()) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await db.addUser({
        username: formData.username,
        fullName: formData.fullName,
        role: formData.role,
        password: formData.password,
      })
      // Reload users
      const data = await db.getUsers()
      setUsers(
        data.map((u: Record<string, unknown>) => ({
          id: u.id as string,
          username: u.username as string,
          fullName: (u.full_name || u.fullName) as string,
          role: u.role as "owner" | "staff",
          status: u.status as "active" | "inactive",
          createdAt: (u.created_at || u.createdAt) as string,
          lastLogin: (u.last_login || u.lastLogin) as string | undefined,
        })),
      )
      setShowForm(false)
      setFormData({ username: "", fullName: "", password: "staff123", role: "staff" })
    } catch (error) {
      console.error("Failed to add user:", error)
    } finally {
      setSaving(false)
    }
  }

  const ownerCount = users.filter((u) => u.role === "owner").length
  const staffCount = users.filter((u) => u.role === "staff").length

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">User Management</h1>
              <p className="text-muted-foreground">Manage staff accounts and permissions</p>
            </div>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-100">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{users.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-purple-100">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Owners</p>
                    <p className="text-2xl font-bold">{ownerCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-100">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Staff</p>
                    <p className="text-2xl font-bold">{staffCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Login</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground font-semibold">
                                {u.fullName.charAt(0)}
                              </div>
                              <span className="font-medium">{u.fullName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{u.username}</TableCell>
                          <TableCell>
                            <Badge variant={u.role === "owner" ? "default" : "secondary"}>
                              {u.role === "owner" ? (
                                <>
                                  <Shield className="h-3 w-3 mr-1" /> Owner
                                </>
                              ) : (
                                <>
                                  <User className="h-3 w-3 mr-1" /> Staff
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={u.status === "active" ? "outline" : "secondary"}
                              className={u.status === "active" ? "bg-green-50 text-green-700 border-green-200" : ""}
                            >
                              {u.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(u.createdAt), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {u.lastLogin ? format(new Date(u.lastLogin), "dd MMM yyyy hh:mm a") : "Never"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Info */}
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Owner</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Full access to all features</li>
                    <li>View and export reports</li>
                    <li>Manage products and stock</li>
                    <li>Manage users and settings</li>
                    <li>Delete transactions</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <h4 className="font-semibold">Staff</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Billing and sales only</li>
                    <li>View product list</li>
                    <li>Cannot edit prices</li>
                    <li>Cannot delete bills</li>
                    <li>Cannot access reports</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add User Dialog */}
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(v: "owner" | "staff") => setFormData({ ...formData, role: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add User
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  )
}
