import { createClient } from "@/lib/supabase/client"
import type { Product, Sale, SaleItem, StockMovement, User, HeldBill, ShopSettings } from "./types"

const supabase = createClient()

// ==================== USERS ====================
export async function getUsers() {
  const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data as User[]
}

export async function loginUser(username: string, password: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .eq("password_hash", password)
    .eq("status", "active")
    .single()

  if (error || !data) return null

  // Update last login
  await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", data.id)

  return {
    id: data.id,
    username: data.username,
    fullName: data.full_name,
    role: data.role,
    status: data.status,
    createdAt: data.created_at,
    lastLogin: new Date().toISOString(),
  } as User
}

export async function addUser(user: { username: string; fullName: string; role: "owner" | "staff"; password: string }) {
  const { data, error } = await supabase
    .from("users")
    .insert({
      username: user.username,
      full_name: user.fullName,
      role: user.role,
      password_hash: user.password,
      status: "active",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateUserStatus(id: string, status: "active" | "inactive") {
  const { error } = await supabase.from("users").update({ status }).eq("id", id)

  if (error) throw error
}

// ==================== PRODUCTS ====================
export async function getProducts() {
  const { data, error } = await supabase.from("products").select("*").order("name", { ascending: true })

  if (error) throw error
  return (data || []).map(mapProductFromDB)
}

export async function getActiveProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .order("name", { ascending: true })

  if (error) throw error
  return (data || []).map(mapProductFromDB)
}

export async function searchProducts(query: string) {
  const q = query.toLowerCase()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .or(`name.ilike.%${q}%,barcode.ilike.%${q}%,brand.ilike.%${q}%,category.ilike.%${q}%`)
    .limit(20)

  if (error) throw error
  return (data || []).map(mapProductFromDB)
}

export async function getProductByBarcode(
  barcode: string,
): Promise<{ product: Product | null; duplicates: Product[] }> {
  const { data, error } = await supabase.from("products").select("*").eq("barcode", barcode).eq("status", "active")

  if (error) throw error

  const products = (data || []).map(mapProductFromDB)

  if (products.length === 0) {
    return { product: null, duplicates: [] }
  }

  if (products.length === 1) {
    return { product: products[0], duplicates: [] }
  }

  // Multiple products with same barcode - return first and flag duplicates
  return { product: products[0], duplicates: products }
}

export async function checkBarcodeExists(barcode: string, excludeProductId?: string): Promise<boolean> {
  let query = supabase.from("products").select("id").eq("barcode", barcode).eq("status", "active")

  if (excludeProductId) {
    query = query.neq("id", excludeProductId)
  }

  const { data, error } = await query

  if (error) throw error
  return (data || []).length > 0
}

export async function addProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">) {
  const { data, error } = await supabase
    .from("products")
    .insert({
      barcode: product.barcode || null,
      name: product.name,
      category: product.category,
      unit: product.unit,
      purchase_price: product.purchasePrice,
      selling_price: product.sellingPrice,
      current_stock: product.currentStock,
      min_stock_level: product.minStockLevel,
      expiry_date: product.expiryDate || null,
      gst_rate: product.gstRate,
      brand: product.brand || null,
      description: product.description || null,
      status: product.status,
    })
    .select()
    .single()

  if (error) throw error
  return mapProductFromDB(data)
}

export async function updateProduct(id: string, updates: Partial<Product>) {
  const dbUpdates: Record<string, unknown> = {}

  if (updates.barcode !== undefined) dbUpdates.barcode = updates.barcode || null
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.category !== undefined) dbUpdates.category = updates.category
  if (updates.unit !== undefined) dbUpdates.unit = updates.unit
  if (updates.purchasePrice !== undefined) dbUpdates.purchase_price = updates.purchasePrice
  if (updates.sellingPrice !== undefined) dbUpdates.selling_price = updates.sellingPrice
  if (updates.currentStock !== undefined) dbUpdates.current_stock = updates.currentStock
  if (updates.minStockLevel !== undefined) dbUpdates.min_stock_level = updates.minStockLevel
  if (updates.expiryDate !== undefined) dbUpdates.expiry_date = updates.expiryDate || null
  if (updates.gstRate !== undefined) dbUpdates.gst_rate = updates.gstRate
  if (updates.brand !== undefined) dbUpdates.brand = updates.brand || null
  if (updates.description !== undefined) dbUpdates.description = updates.description || null
  if (updates.status !== undefined) dbUpdates.status = updates.status

  const { error } = await supabase.from("products").update(dbUpdates).eq("id", id)

  if (error) throw error
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").update({ status: "inactive" }).eq("id", id)

  if (error) throw error
}

export async function getLowStockProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .filter("current_stock", "lte", supabase.rpc ? 0 : 10) // Will filter in JS

  if (error) throw error

  const products = (data || []).map(mapProductFromDB)
  return products.filter((p) => p.currentStock <= p.minStockLevel)
}

export async function getExpiringProducts(days: number) {
  const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .not("expiry_date", "is", null)
    .lte("expiry_date", futureDate)

  if (error) throw error
  return (data || []).map(mapProductFromDB)
}

function mapProductFromDB(data: Record<string, unknown>): Product {
  return {
    id: data.id as string,
    barcode: data.barcode as string | undefined,
    name: data.name as string,
    category: data.category as string,
    unit: data.unit as string,
    purchasePrice: Number(data.purchase_price),
    sellingPrice: Number(data.selling_price),
    currentStock: Number(data.current_stock),
    minStockLevel: Number(data.min_stock_level),
    expiryDate: data.expiry_date as string | undefined,
    gstRate: Number(data.gst_rate),
    brand: data.brand as string | undefined,
    description: data.description as string | undefined,
    status: data.status as "active" | "inactive",
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

// ==================== SALES ====================
export async function getSales() {
  const { data, error } = await supabase
    .from("sales")
    .select("*, sale_items(*)")
    .order("sale_date", { ascending: false })

  if (error) throw error
  return (data || []).map(mapSaleFromDB)
}

export async function getTodaySales() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from("sales")
    .select("*, sale_items(*)")
    .eq("status", "completed")
    .gte("sale_date", today.toISOString())
    .order("sale_date", { ascending: false })

  if (error) throw error
  return (data || []).map(mapSaleFromDB)
}

export async function getSalesByDateRange(from: Date, to: Date) {
  const { data, error } = await supabase
    .from("sales")
    .select("*, sale_items(*)")
    .eq("status", "completed")
    .gte("sale_date", from.toISOString())
    .lte("sale_date", to.toISOString())
    .order("sale_date", { ascending: false })

  if (error) throw error
  return (data || []).map(mapSaleFromDB)
}

export async function addSale(sale: Omit<Sale, "id" | "invoiceNumber" | "saleDate">, items: Omit<SaleItem, "id">[]) {
  // Get next invoice number
  const { data: counterData, error: counterError } = await supabase.rpc("get_next_invoice_number")

  if (counterError) throw counterError

  const year = new Date().getFullYear()
  const invoiceNumber = `INV-${year}-${String(counterData).padStart(5, "0")}`

  // Insert sale
  const { data: saleData, error: saleError } = await supabase
    .from("sales")
    .insert({
      invoice_number: invoiceNumber,
      subtotal: sale.subtotal,
      discount_amount: sale.discountAmount,
      discount_percent: sale.discountPercent,
      cgst_amount: sale.cgstAmount,
      sgst_amount: sale.sgstAmount,
      total_tax: sale.totalTax,
      total_amount: sale.totalAmount,
      payment_mode: sale.paymentMode,
      amount_received: sale.amountReceived,
      change_returned: sale.changeReturned,
      status: sale.status,
      created_by: sale.createdBy,
      notes: sale.notes,
    })
    .select()
    .single()

  if (saleError) throw saleError

  // Insert sale items
  const saleItems = items.map((item) => ({
    sale_id: saleData.id,
    product_id: item.productId,
    product_name: item.productName,
    barcode: item.barcode,
    quantity: item.quantity,
    unit: item.unit,
    unit_price: item.unitPrice,
    discount: item.discount,
    gst_rate: item.gstRate,
    gst_amount: item.gstAmount,
    subtotal: item.subtotal,
  }))

  const { error: itemsError } = await supabase.from("sale_items").insert(saleItems)

  if (itemsError) throw itemsError

  // Update product stock
  for (const item of items) {
    await supabase.rpc("", {}) // We'll update stock manually
    const { data: productData } = await supabase
      .from("products")
      .select("current_stock")
      .eq("id", item.productId)
      .single()

    if (productData) {
      await supabase
        .from("products")
        .update({ current_stock: productData.current_stock - item.quantity })
        .eq("id", item.productId)
    }
  }

  return {
    ...mapSaleFromDB({ ...saleData, sale_items: [] }),
    items: items.map((item, i) => ({ ...item, id: `item-${i}` })),
  }
}

function mapSaleFromDB(data: Record<string, unknown>): Sale {
  const items = ((data.sale_items as Record<string, unknown>[]) || []).map((item) => ({
    id: item.id as string,
    productId: item.product_id as string,
    productName: item.product_name as string,
    barcode: item.barcode as string | undefined,
    quantity: Number(item.quantity),
    unit: item.unit as string,
    unitPrice: Number(item.unit_price),
    discount: Number(item.discount),
    gstRate: Number(item.gst_rate),
    gstAmount: Number(item.gst_amount),
    subtotal: Number(item.subtotal),
  }))

  return {
    id: data.id as string,
    invoiceNumber: data.invoice_number as string,
    items,
    subtotal: Number(data.subtotal),
    discountAmount: Number(data.discount_amount),
    discountPercent: Number(data.discount_percent),
    cgstAmount: Number(data.cgst_amount),
    sgstAmount: Number(data.sgst_amount),
    totalTax: Number(data.total_tax),
    totalAmount: Number(data.total_amount),
    paymentMode: data.payment_mode as "cash" | "upi" | "card",
    amountReceived: data.amount_received ? Number(data.amount_received) : undefined,
    changeReturned: data.change_returned ? Number(data.change_returned) : undefined,
    status: data.status as "completed" | "returned" | "cancelled",
    saleDate: data.sale_date as string,
    createdBy: data.created_by as string,
    notes: data.notes as string | undefined,
  }
}

// ==================== STOCK MOVEMENTS ====================
export async function getStockMovements() {
  const { data, error } = await supabase
    .from("stock_movements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) throw error
  return (data || []).map(mapStockMovementFromDB)
}

export async function addStockMovement(movement: Omit<StockMovement, "id" | "createdAt">) {
  const { data, error } = await supabase
    .from("stock_movements")
    .insert({
      product_id: movement.productId,
      product_name: movement.productName,
      movement_type: movement.movementType,
      quantity: movement.quantity,
      reason: movement.reason,
      purchase_price: movement.purchasePrice,
      supplier_name: movement.supplierName,
      previous_stock: movement.previousStock,
      new_stock: movement.newStock,
      created_by: movement.createdBy,
    })
    .select()
    .single()

  if (error) throw error

  // Update product stock
  await supabase.from("products").update({ current_stock: movement.newStock }).eq("id", movement.productId)

  return mapStockMovementFromDB(data)
}

function mapStockMovementFromDB(data: Record<string, unknown>): StockMovement {
  return {
    id: data.id as string,
    productId: data.product_id as string,
    productName: data.product_name as string,
    movementType: data.movement_type as "stock_in" | "stock_out" | "adjustment",
    quantity: Number(data.quantity),
    reason: data.reason as string | undefined,
    purchasePrice: data.purchase_price ? Number(data.purchase_price) : undefined,
    supplierName: data.supplier_name as string | undefined,
    previousStock: Number(data.previous_stock),
    newStock: Number(data.new_stock),
    createdAt: data.created_at as string,
    createdBy: data.created_by as string,
  }
}

// ==================== HELD BILLS ====================
export async function getHeldBills() {
  const { data, error } = await supabase.from("held_bills").select("*").order("held_at", { ascending: false })

  if (error) throw error
  return (data || []).map(mapHeldBillFromDB)
}

export async function holdBill(bill: Omit<HeldBill, "id" | "heldAt">) {
  const { data, error } = await supabase
    .from("held_bills")
    .insert({
      bill_name: bill.billName,
      items: JSON.stringify(bill.items),
      subtotal: bill.subtotal,
      discount: bill.discount,
      held_by: bill.heldBy,
    })
    .select()
    .single()

  if (error) throw error
  return mapHeldBillFromDB(data)
}

export async function deleteHeldBill(id: string) {
  const { error } = await supabase.from("held_bills").delete().eq("id", id)

  if (error) throw error
}

function mapHeldBillFromDB(data: Record<string, unknown>): HeldBill {
  let items = []
  try {
    items = typeof data.items === "string" ? JSON.parse(data.items) : data.items
  } catch {
    items = []
  }

  return {
    id: data.id as string,
    billName: data.bill_name as string | undefined,
    items,
    subtotal: Number(data.subtotal),
    discount: Number(data.discount),
    heldAt: data.held_at as string,
    heldBy: data.held_by as string,
  }
}

// ==================== SETTINGS ====================
export async function getSettings(): Promise<ShopSettings> {
  const { data, error } = await supabase.from("shop_settings").select("*").limit(1).single()

  if (error || !data) {
    return getDefaultSettings()
  }

  return {
    shopName: data.shop_name,
    addressLine1: data.address_line1 || "",
    addressLine2: data.address_line2 || "",
    city: data.city || "",
    state: data.state || "",
    pincode: data.pincode || "",
    phone: data.phone || "",
    email: data.email || "",
    gstin: data.gstin || "",
    receiptHeader: data.receipt_header || "Welcome!",
    receiptFooter: data.receipt_footer || "Thank you! Visit again!",
    invoicePrefix: data.invoice_prefix || "INV",
    startingInvoiceNumber: data.starting_invoice_number || 1,
    taxInclusive: data.tax_inclusive ?? true,
    enableDiscount: data.enable_discount ?? true,
    maxDiscountPercent: data.max_discount_percent || 50,
    showGstBreakdown: data.show_gst_breakdown ?? true,
    lowStockThreshold: data.low_stock_threshold || 10,
    expiryAlertDays: data.expiry_alert_days || 7,
    theme: data.theme || "light",
  }
}

export async function updateSettings(updates: Partial<ShopSettings>) {
  const dbUpdates: Record<string, unknown> = {}

  if (updates.shopName !== undefined) dbUpdates.shop_name = updates.shopName
  if (updates.addressLine1 !== undefined) dbUpdates.address_line1 = updates.addressLine1
  if (updates.addressLine2 !== undefined) dbUpdates.address_line2 = updates.addressLine2
  if (updates.city !== undefined) dbUpdates.city = updates.city
  if (updates.state !== undefined) dbUpdates.state = updates.state
  if (updates.pincode !== undefined) dbUpdates.pincode = updates.pincode
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone
  if (updates.email !== undefined) dbUpdates.email = updates.email
  if (updates.gstin !== undefined) dbUpdates.gstin = updates.gstin
  if (updates.receiptHeader !== undefined) dbUpdates.receipt_header = updates.receiptHeader
  if (updates.receiptFooter !== undefined) dbUpdates.receipt_footer = updates.receiptFooter
  if (updates.invoicePrefix !== undefined) dbUpdates.invoice_prefix = updates.invoicePrefix
  if (updates.startingInvoiceNumber !== undefined) dbUpdates.starting_invoice_number = updates.startingInvoiceNumber
  if (updates.taxInclusive !== undefined) dbUpdates.tax_inclusive = updates.taxInclusive
  if (updates.enableDiscount !== undefined) dbUpdates.enable_discount = updates.enableDiscount
  if (updates.maxDiscountPercent !== undefined) dbUpdates.max_discount_percent = updates.maxDiscountPercent
  if (updates.showGstBreakdown !== undefined) dbUpdates.show_gst_breakdown = updates.showGstBreakdown
  if (updates.lowStockThreshold !== undefined) dbUpdates.low_stock_threshold = updates.lowStockThreshold
  if (updates.expiryAlertDays !== undefined) dbUpdates.expiry_alert_days = updates.expiryAlertDays
  if (updates.theme !== undefined) dbUpdates.theme = updates.theme

  const { error } = await supabase
    .from("shop_settings")
    .update(dbUpdates)
    .eq("id", (await supabase.from("shop_settings").select("id").limit(1).single()).data?.id)

  if (error) throw error
}

function getDefaultSettings(): ShopSettings {
  return {
    shopName: "My Kirana Store",
    addressLine1: "123 Main Street",
    addressLine2: "Near Bus Stand",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    phone: "9876543210",
    email: "",
    gstin: "",
    receiptHeader: "Welcome!",
    receiptFooter: "Thank you! Visit again!",
    invoicePrefix: "INV",
    startingInvoiceNumber: 1,
    taxInclusive: true,
    enableDiscount: true,
    maxDiscountPercent: 50,
    showGstBreakdown: true,
    lowStockThreshold: 10,
    expiryAlertDays: 7,
    theme: "light",
  }
}
