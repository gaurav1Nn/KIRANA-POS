// Types for the Kirana POS system

export interface User {
  id: string
  username: string
  fullName: string
  role: "owner" | "staff"
  status: "active" | "inactive"
  createdAt: string
  lastLogin?: string
}

export interface Product {
  id: string
  barcode?: string
  name: string
  category: string
  unit: string
  purchasePrice: number
  sellingPrice: number
  currentStock: number
  minStockLevel: number
  expiryDate?: string
  gstRate: number
  brand?: string
  description?: string
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
}

export interface CartItem extends Product {
  quantity: number
  discount: number
  note?: string
}

export interface StockMovement {
  id: string
  productId: string
  productName: string
  movementType: "stock_in" | "stock_out" | "adjustment"
  quantity: number
  reason?: string
  purchasePrice?: number
  supplierName?: string
  previousStock: number
  newStock: number
  createdAt: string
  createdBy: string
}

export interface Sale {
  id: string
  invoiceNumber: string
  items: SaleItem[]
  subtotal: number
  discountAmount: number
  discountPercent: number
  cgstAmount: number
  sgstAmount: number
  totalTax: number
  totalAmount: number
  paymentMode: "cash" | "upi" | "card"
  amountReceived?: number
  changeReturned?: number
  status: "completed" | "returned" | "cancelled"
  saleDate: string
  createdBy: string
  notes?: string
}

export interface SaleItem {
  id: string
  productId: string
  productName: string
  barcode?: string
  quantity: number
  unit: string
  unitPrice: number
  discount: number
  gstRate: number
  gstAmount: number
  subtotal: number
}

export interface HeldBill {
  id: string
  billName?: string
  items: CartItem[]
  subtotal: number
  discount: number
  heldAt: string
  heldBy: string
}

export interface ShopSettings {
  shopName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pincode: string
  phone: string
  email: string
  gstin: string
  receiptHeader: string
  receiptFooter: string
  invoicePrefix: string
  startingInvoiceNumber: number
  taxInclusive: boolean
  enableDiscount: boolean
  maxDiscountPercent: number
  showGstBreakdown: boolean
  lowStockThreshold: number
  expiryAlertDays: number
  theme: "light" | "dark" | "auto"
}

export const CATEGORIES = [
  "Groceries",
  "Beverages",
  "Snacks",
  "Personal Care",
  "Household",
  "Dairy",
  "Frozen",
  "Others",
] as const

export const UNITS = ["Piece", "Kg", "Gram", "Liter", "ML", "Packet", "Box", "Dozen"] as const

export const GST_RATES = [0, 5, 12, 18, 28] as const
