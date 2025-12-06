import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Product, CartItem, Sale, HeldBill, StockMovement, ShopSettings } from "./types"
import * as db from "./db"

// Generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9)

// Auth Store - keeps user session in localStorage for persistence across page refreshes
interface AuthState {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isOwner: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      login: async (username, password) => {
        set({ isLoading: true })
        try {
          const user = await db.loginUser(username, password)
          if (user) {
            set({ user, isLoading: false })
            return true
          }
          set({ isLoading: false })
          return false
        } catch (error) {
          console.error("Login error:", error)
          set({ isLoading: false })
          return false
        }
      },
      logout: () => set({ user: null }),
      isOwner: () => get().user?.role === "owner",
    }),
    { name: "kirana-auth" },
  ),
)

// Product Store - now uses Supabase
interface ProductState {
  products: Product[]
  isLoading: boolean
  error: string | null
  fetchProducts: () => Promise<void>
  addProduct: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  getProduct: (id: string) => Product | undefined
  searchProducts: (query: string) => Promise<Product[]>
  getProductByBarcode: (barcode: string) => Promise<{ product: Product | null; duplicates: Product[] }>
  checkBarcodeExists: (barcode: string, excludeProductId?: string) => Promise<boolean>
  getLowStockProducts: () => Product[]
  getExpiringProducts: (days: number) => Product[]
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  fetchProducts: async () => {
    set({ isLoading: true, error: null })
    try {
      const products = await db.getActiveProducts()
      set({ products, isLoading: false })
    } catch (error) {
      console.error("Fetch products error:", error)
      set({ error: "Failed to fetch products", isLoading: false })
    }
  },
  addProduct: async (product) => {
    try {
      const newProduct = await db.addProduct(product)
      set((state) => ({ products: [...state.products, newProduct] }))
    } catch (error) {
      console.error("Add product error:", error)
      throw error
    }
  },
  updateProduct: async (id, updates) => {
    try {
      await db.updateProduct(id, updates)
      set((state) => ({
        products: state.products.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p,
        ),
      }))
    } catch (error) {
      console.error("Update product error:", error)
      throw error
    }
  },
  deleteProduct: async (id) => {
    try {
      await db.deleteProduct(id)
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
      }))
    } catch (error) {
      console.error("Delete product error:", error)
      throw error
    }
  },
  getProduct: (id) => get().products.find((p) => p.id === id),
  searchProducts: async (query) => {
    try {
      return await db.searchProducts(query)
    } catch (error) {
      console.error("Search products error:", error)
      return []
    }
  },
  getProductByBarcode: async (barcode) => {
    try {
      return await db.getProductByBarcode(barcode)
    } catch (error) {
      console.error("Get product by barcode error:", error)
      return { product: null, duplicates: [] }
    }
  },
  checkBarcodeExists: async (barcode, excludeProductId) => {
    try {
      return await db.checkBarcodeExists(barcode, excludeProductId)
    } catch (error) {
      console.error("Check barcode exists error:", error)
      return false
    }
  },
  getLowStockProducts: () => {
    return get().products.filter((p) => p.status === "active" && p.currentStock <= p.minStockLevel)
  },
  getExpiringProducts: (days) => {
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    return get().products.filter((p) => p.status === "active" && p.expiryDate && new Date(p.expiryDate) <= futureDate)
  },
}))

// Cart Store - kept in memory (no persistence needed)
interface CartState {
  items: CartItem[]
  discount: number
  discountType: "amount" | "percent"
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  setDiscount: (value: number, type: "amount" | "percent") => void
  clearCart: () => void
  getSubtotal: () => number
  getDiscountAmount: () => number
  getTaxBreakdown: () => { cgst: number; sgst: number; total: number }
  getTotal: () => number
  setItems: (items: CartItem[]) => void
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: 0,
  discountType: "amount",
  addItem: (product, quantity = 1) => {
    set((state) => {
      const existingItem = state.items.find((i) => i.id === product.id)
      if (existingItem) {
        return {
          items: state.items.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i)),
        }
      }
      return {
        items: [...state.items, { ...product, quantity, discount: 0 }],
      }
    })
  },
  removeItem: (productId) => {
    set((state) => ({ items: state.items.filter((i) => i.id !== productId) }))
  },
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }
    set((state) => ({
      items: state.items.map((i) => (i.id === productId ? { ...i, quantity } : i)),
    }))
  },
  setDiscount: (value, type) => {
    set({ discount: value, discountType: type })
  },
  clearCart: () => {
    set({ items: [], discount: 0, discountType: "amount" })
  },
  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0)
  },
  getDiscountAmount: () => {
    const { discount, discountType } = get()
    const subtotal = get().getSubtotal()
    if (discountType === "percent") {
      return (subtotal * discount) / 100
    }
    return discount
  },
  getTaxBreakdown: () => {
    const items = get().items
    let totalTax = 0
    items.forEach((item) => {
      const itemTotal = item.sellingPrice * item.quantity
      const taxAmount = (itemTotal * item.gstRate) / 100
      totalTax += taxAmount
    })
    return {
      cgst: totalTax / 2,
      sgst: totalTax / 2,
      total: totalTax,
    }
  },
  getTotal: () => {
    const subtotal = get().getSubtotal()
    const discount = get().getDiscountAmount()
    return subtotal - discount
  },
  setItems: (items) => {
    set({ items })
  },
}))

// Sales Store - now uses Supabase
interface SalesState {
  sales: Sale[]
  stockMovements: StockMovement[]
  heldBills: HeldBill[]
  isLoading: boolean
  fetchSales: () => Promise<void>
  fetchTodaySales: () => Promise<Sale[]>
  fetchHeldBills: () => Promise<void>
  fetchStockMovements: () => Promise<void>
  addSale: (sale: Omit<Sale, "id" | "invoiceNumber" | "saleDate">) => Promise<Sale>
  getSale: (id: string) => Sale | undefined
  getTodaySales: () => Sale[]
  addStockMovement: (movement: Omit<StockMovement, "id" | "createdAt">) => Promise<void>
  holdBill: (bill: Omit<HeldBill, "id" | "heldAt">) => Promise<void>
  resumeBill: (id: string) => Promise<HeldBill | undefined>
  deleteHeldBill: (id: string) => Promise<void>
}

export const useSalesStore = create<SalesState>((set, get) => ({
  sales: [],
  stockMovements: [],
  heldBills: [],
  isLoading: false,
  fetchSales: async () => {
    set({ isLoading: true })
    try {
      const sales = await db.getSales()
      set({ sales, isLoading: false })
    } catch (error) {
      console.error("Fetch sales error:", error)
      set({ isLoading: false })
    }
  },
  fetchTodaySales: async () => {
    try {
      const sales = await db.getTodaySales()
      return sales
    } catch (error) {
      console.error("Fetch today sales error:", error)
      return []
    }
  },
  fetchHeldBills: async () => {
    try {
      const heldBills = await db.getHeldBills()
      set({ heldBills })
    } catch (error) {
      console.error("Fetch held bills error:", error)
    }
  },
  fetchStockMovements: async () => {
    try {
      const stockMovements = await db.getStockMovements()
      set({ stockMovements })
    } catch (error) {
      console.error("Fetch stock movements error:", error)
    }
  },
  addSale: async (saleData) => {
    try {
      const items = useCartStore.getState().items.map((item) => ({
        productId: item.id,
        productName: item.name,
        barcode: item.barcode,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.sellingPrice,
        discount: item.discount,
        gstRate: item.gstRate,
        gstAmount: (item.sellingPrice * item.quantity * item.gstRate) / 100,
        subtotal: item.sellingPrice * item.quantity,
      }))

      const sale = await db.addSale(saleData, items)
      set((state) => ({ sales: [sale, ...state.sales] }))

      // Refresh products to get updated stock
      await useProductStore.getState().fetchProducts()

      return sale
    } catch (error) {
      console.error("Add sale error:", error)
      throw error
    }
  },
  getSale: (id) => get().sales.find((s) => s.id === id),
  getTodaySales: () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return get().sales.filter((s) => {
      const saleDate = new Date(s.saleDate)
      saleDate.setHours(0, 0, 0, 0)
      return saleDate.getTime() === today.getTime() && s.status === "completed"
    })
  },
  addStockMovement: async (movement) => {
    try {
      const newMovement = await db.addStockMovement(movement)
      set((state) => ({ stockMovements: [newMovement, ...state.stockMovements] }))

      // Update local product stock
      useProductStore.setState((state) => ({
        products: state.products.map((p) =>
          p.id === movement.productId ? { ...p, currentStock: movement.newStock } : p,
        ),
      }))
    } catch (error) {
      console.error("Add stock movement error:", error)
      throw error
    }
  },
  holdBill: async (bill) => {
    try {
      const newBill = await db.holdBill(bill)
      set((state) => ({ heldBills: [...state.heldBills, newBill] }))
    } catch (error) {
      console.error("Hold bill error:", error)
      throw error
    }
  },
  resumeBill: async (id) => {
    const bill = get().heldBills.find((b) => b.id === id)
    if (bill) {
      try {
        await db.deleteHeldBill(id)
        set((state) => ({ heldBills: state.heldBills.filter((b) => b.id !== id) }))
      } catch (error) {
        console.error("Resume bill error:", error)
      }
    }
    return bill
  },
  deleteHeldBill: async (id) => {
    try {
      await db.deleteHeldBill(id)
      set((state) => ({ heldBills: state.heldBills.filter((b) => b.id !== id) }))
    } catch (error) {
      console.error("Delete held bill error:", error)
      throw error
    }
  },
}))

// Settings Store - now uses Supabase
interface SettingsState {
  settings: ShopSettings
  isLoading: boolean
  fetchSettings: () => Promise<void>
  updateSettings: (updates: Partial<ShopSettings>) => Promise<void>
}

const defaultSettings: ShopSettings = {
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

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  isLoading: false,
  fetchSettings: async () => {
    set({ isLoading: true })
    try {
      const settings = await db.getSettings()
      set({ settings, isLoading: false })
    } catch (error) {
      console.error("Fetch settings error:", error)
      set({ isLoading: false })
    }
  },
  updateSettings: async (updates) => {
    try {
      await db.updateSettings(updates)
      set((state) => ({ settings: { ...state.settings, ...updates } }))
    } catch (error) {
      console.error("Update settings error:", error)
      throw error
    }
  },
}))
