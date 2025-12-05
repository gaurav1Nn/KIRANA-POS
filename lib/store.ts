import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Product, CartItem, Sale, HeldBill, StockMovement, ShopSettings } from "./types"

// Generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9)

// Auth Store
interface AuthState {
  user: User | null
  users: User[]
  login: (username: string, password: string) => boolean
  logout: () => void
  isOwner: () => boolean
  addUser: (user: Omit<User, "id" | "createdAt">) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      users: [
        {
          id: "1",
          username: "owner",
          fullName: "Shop Owner",
          role: "owner",
          status: "active",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          username: "staff",
          fullName: "Staff Member",
          role: "staff",
          status: "active",
          createdAt: new Date().toISOString(),
        },
      ],
      login: (username, password) => {
        // Simple auth - in production use proper hashing
        const users = get().users
        const user = users.find((u) => u.username === username && u.status === "active")
        if (user && (password === "admin123" || password === "staff123")) {
          set({ user: { ...user, lastLogin: new Date().toISOString() } })
          return true
        }
        return false
      },
      logout: () => set({ user: null }),
      isOwner: () => get().user?.role === "owner",
      addUser: (userData) => {
        const newUser: User = {
          ...userData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ users: [...state.users, newUser] }))
      },
    }),
    { name: "kirana-auth" },
  ),
)

// Product Store
interface ProductState {
  products: Product[]
  addProduct: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => void
  updateProduct: (id: string, updates: Partial<Product>) => void
  deleteProduct: (id: string) => void
  getProduct: (id: string) => Product | undefined
  searchProducts: (query: string) => Product[]
  getLowStockProducts: () => Product[]
  getExpiringProducts: (days: number) => Product[]
}

// Sample products
const sampleProducts: Product[] = [
  {
    id: "1",
    barcode: "8901234567890",
    name: "Tata Salt 1kg",
    category: "Groceries",
    unit: "Packet",
    purchasePrice: 18,
    sellingPrice: 22,
    currentStock: 50,
    minStockLevel: 10,
    gstRate: 5,
    brand: "Tata",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    barcode: "8901234567891",
    name: "Parle-G Biscuit",
    category: "Snacks",
    unit: "Packet",
    purchasePrice: 8,
    sellingPrice: 10,
    currentStock: 100,
    minStockLevel: 20,
    gstRate: 18,
    brand: "Parle",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    barcode: "8901234567892",
    name: "Amul Butter 100g",
    category: "Dairy",
    unit: "Piece",
    purchasePrice: 48,
    sellingPrice: 56,
    currentStock: 25,
    minStockLevel: 10,
    gstRate: 12,
    brand: "Amul",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    barcode: "8901234567893",
    name: "Maggi Noodles",
    category: "Snacks",
    unit: "Packet",
    purchasePrice: 11,
    sellingPrice: 14,
    currentStock: 80,
    minStockLevel: 15,
    gstRate: 18,
    brand: "Nestle",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    barcode: "8901234567894",
    name: "Coca Cola 750ml",
    category: "Beverages",
    unit: "Piece",
    purchasePrice: 35,
    sellingPrice: 40,
    currentStock: 40,
    minStockLevel: 10,
    gstRate: 28,
    brand: "Coca Cola",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "6",
    barcode: "8901234567895",
    name: "Surf Excel 1kg",
    category: "Household",
    unit: "Packet",
    purchasePrice: 180,
    sellingPrice: 210,
    currentStock: 15,
    minStockLevel: 5,
    gstRate: 18,
    brand: "Surf",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "7",
    barcode: "8901234567896",
    name: "Dettol Soap",
    category: "Personal Care",
    unit: "Piece",
    purchasePrice: 40,
    sellingPrice: 48,
    currentStock: 30,
    minStockLevel: 10,
    gstRate: 18,
    brand: "Dettol",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "8",
    barcode: "8901234567897",
    name: "Aashirvaad Atta 5kg",
    category: "Groceries",
    unit: "Packet",
    purchasePrice: 240,
    sellingPrice: 280,
    currentStock: 8,
    minStockLevel: 10,
    gstRate: 5,
    brand: "Aashirvaad",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "9",
    barcode: "8901234567898",
    name: "Fortune Oil 1L",
    category: "Groceries",
    unit: "Piece",
    purchasePrice: 140,
    sellingPrice: 165,
    currentStock: 20,
    minStockLevel: 8,
    gstRate: 5,
    brand: "Fortune",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10",
    barcode: "8901234567899",
    name: "Britannia Bread",
    category: "Dairy",
    unit: "Piece",
    purchasePrice: 35,
    sellingPrice: 42,
    currentStock: 5,
    minStockLevel: 10,
    gstRate: 5,
    brand: "Britannia",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: sampleProducts,
      addProduct: (product) => {
        const newProduct: Product = {
          ...product,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ products: [...state.products, newProduct] }))
      },
      updateProduct: (id, updates) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p,
          ),
        }))
      },
      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, status: "inactive" as const } : p)),
        }))
      },
      getProduct: (id) => get().products.find((p) => p.id === id),
      searchProducts: (query) => {
        const q = query.toLowerCase()
        return get().products.filter(
          (p) =>
            p.status === "active" &&
            (p.name.toLowerCase().includes(q) ||
              p.barcode?.includes(q) ||
              p.brand?.toLowerCase().includes(q) ||
              p.category.toLowerCase().includes(q)),
        )
      },
      getLowStockProducts: () => {
        return get().products.filter((p) => p.status === "active" && p.currentStock <= p.minStockLevel)
      },
      getExpiringProducts: (days) => {
        const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        return get().products.filter(
          (p) => p.status === "active" && p.expiryDate && new Date(p.expiryDate) <= futureDate,
        )
      },
    }),
    { name: "kirana-products" },
  ),
)

// Cart Store
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
    // Split into CGST and SGST (assuming intra-state)
    return {
      cgst: totalTax / 2,
      sgst: totalTax / 2,
      total: totalTax,
    }
  },
  getTotal: () => {
    const subtotal = get().getSubtotal()
    const discount = get().getDiscountAmount()
    // For simplicity, tax is included in MRP
    return subtotal - discount
  },
}))

// Sales Store
interface SalesState {
  sales: Sale[]
  stockMovements: StockMovement[]
  heldBills: HeldBill[]
  invoiceCounter: number
  addSale: (sale: Omit<Sale, "id" | "invoiceNumber" | "saleDate">) => Sale
  getSale: (id: string) => Sale | undefined
  getTodaySales: () => Sale[]
  getSalesByDateRange: (from: Date, to: Date) => Sale[]
  addStockMovement: (movement: Omit<StockMovement, "id" | "createdAt">) => void
  holdBill: (bill: Omit<HeldBill, "id" | "heldAt">) => void
  resumeBill: (id: string) => HeldBill | undefined
  deleteHeldBill: (id: string) => void
}

export const useSalesStore = create<SalesState>()(
  persist(
    (set, get) => ({
      sales: [],
      stockMovements: [],
      heldBills: [],
      invoiceCounter: 1,
      addSale: (saleData) => {
        const counter = get().invoiceCounter
        const year = new Date().getFullYear()
        const invoiceNumber = `INV-${year}-${String(counter).padStart(5, "0")}`

        const sale: Sale = {
          ...saleData,
          id: generateId(),
          invoiceNumber,
          saleDate: new Date().toISOString(),
        }

        set((state) => ({
          sales: [...state.sales, sale],
          invoiceCounter: state.invoiceCounter + 1,
        }))

        return sale
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
      getSalesByDateRange: (from, to) => {
        return get().sales.filter((s) => {
          const saleDate = new Date(s.saleDate)
          return saleDate >= from && saleDate <= to && s.status === "completed"
        })
      },
      addStockMovement: (movement) => {
        const newMovement: StockMovement = {
          ...movement,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ stockMovements: [...state.stockMovements, newMovement] }))
      },
      holdBill: (bill) => {
        const newBill: HeldBill = {
          ...bill,
          id: generateId(),
          heldAt: new Date().toISOString(),
        }
        set((state) => ({ heldBills: [...state.heldBills, newBill] }))
      },
      resumeBill: (id) => {
        const bill = get().heldBills.find((b) => b.id === id)
        if (bill) {
          set((state) => ({ heldBills: state.heldBills.filter((b) => b.id !== id) }))
        }
        return bill
      },
      deleteHeldBill: (id) => {
        set((state) => ({ heldBills: state.heldBills.filter((b) => b.id !== id) }))
      },
    }),
    { name: "kirana-sales" },
  ),
)

// Settings Store
interface SettingsState {
  settings: ShopSettings
  updateSettings: (updates: Partial<ShopSettings>) => void
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

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (updates) => {
        set((state) => ({ settings: { ...state.settings, ...updates } }))
      },
    }),
    { name: "kirana-settings" },
  ),
)
