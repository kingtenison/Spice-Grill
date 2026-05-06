import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MenuItem = {
  id: string
  name: string
  price: number
  image?: string
  image_url?: string
  images?: string[]
  category?: string
  description?: string
}

export type CartItem = MenuItem & {
  quantity: number
}

export type ShippingMethod = {
  id: string
  name: string
  description: string
  cost: number
  estimatedDays: number
}

export type PaymentMethod = 'card' | 'paypal' | 'apple_pay' | 'google_pay' | 'cash'

export type Address = {
  id: string
  name: string // e.g., "Home", "Work"
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault?: boolean
}

export type Coupon = {
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  description: string
  minimumAmount?: number
  validUntil?: Date
}

export type OrderDetails = {
  shippingAddress?: Address
  billingAddress?: Address
  shippingMethod?: ShippingMethod
  paymentMethod?: PaymentMethod
  couponCode?: string
  specialInstructions?: string
  guestCheckout?: boolean
  contactInfo?: {
    name: string
    email: string
    phone: string
  }
}

interface CartState {
  items: CartItem[]
  shippingMethod?: ShippingMethod
  coupon?: Coupon
  orderDetails?: OrderDetails
  currency: string
  taxRate: number

  // Item management
  addItem: (item: MenuItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void

  // Pricing calculations
  getSubtotal: () => number
  getShippingCost: () => number
  getTaxAmount: () => number
  getDiscountAmount: () => number
  getTotal: () => number

  // Shipping & payment
  setShippingMethod: (method: ShippingMethod) => void
  setCoupon: (coupon: Coupon | undefined) => void
  setOrderDetails: (details: Partial<OrderDetails>) => void

  // Settings
  setCurrency: (currency: string) => void
  setTaxRate: (rate: number) => void

  // Validation
  validateCoupon: (code: string) => Promise<boolean>
}

const defaultShippingMethods: ShippingMethod[] = [
  {
    id: 'standard',
    name: 'Standard Delivery',
    description: 'Delivery within 30-45 minutes',
    cost: 0,
    estimatedDays: 0
  },
  {
    id: 'express',
    name: 'Express Delivery',
    description: 'Delivery within 15-20 minutes',
    cost: 4.99,
    estimatedDays: 0
  }
]

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      currency: 'USD',
      taxRate: 0.08, // 8% default tax rate

      addItem: (item) => {
        const currentItems = get().items
        const existingItem = currentItems.find((i) => i.id === item.id)

        if (existingItem) {
          set({
            items: currentItems.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          })
        } else {
          set({ items: [...currentItems, { ...item, quantity: 1 }] })
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) })
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }
        set({
          items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })
      },

      clearCart: () => set({
        items: [],
        coupon: undefined,
        shippingMethod: undefined,
        orderDetails: undefined
      }),

      getSubtotal: () => {
        return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0)
      },

      getShippingCost: () => {
        return get().shippingMethod?.cost || 0
      },

      getTaxAmount: () => {
        const subtotal = get().getSubtotal()
        const shipping = get().getShippingCost()
        const taxableAmount = subtotal + shipping
        return taxableAmount * get().taxRate
      },

      getDiscountAmount: () => {
        const coupon = get().coupon
        if (!coupon) return 0

        const subtotal = get().getSubtotal()

        if (coupon.discountType === 'percentage') {
          return subtotal * (coupon.discountValue / 100)
        } else {
          return Math.min(coupon.discountValue, subtotal)
        }
      },

      getTotal: () => {
        const subtotal = get().getSubtotal()
        const shipping = get().getShippingCost()
        const tax = get().getTaxAmount()
        const discount = get().getDiscountAmount()

        return Math.max(0, subtotal + shipping + tax - discount)
      },

      setShippingMethod: (method) => {
        set({ shippingMethod: method })
      },

      setCoupon: (coupon) => {
        set({ coupon })
      },

      setOrderDetails: (details) => {
        const currentDetails = get().orderDetails || {}
        set({ orderDetails: { ...currentDetails, ...details } })
      },

      setCurrency: (currency) => {
        set({ currency })
      },

      setTaxRate: (rate) => {
        set({ taxRate: rate })
      },

      validateCoupon: async (code: string) => {
        // Simulate API call to validate coupon
        const validCoupons: Record<string, Coupon> = {
          'WELCOME10': {
            code: 'WELCOME10',
            discountType: 'percentage',
            discountValue: 10,
            description: '10% off your first order',
            minimumAmount: 25
          },
          'SAVE5': {
            code: 'SAVE5',
            discountType: 'fixed',
            discountValue: 5,
            description: '$5 off orders over $30',
            minimumAmount: 30
          }
        }

        const coupon = validCoupons[code.toUpperCase()]
        if (!coupon) return false

        const subtotal = get().getSubtotal()
        if (coupon.minimumAmount && subtotal < coupon.minimumAmount) {
          return false
        }

        if (coupon.validUntil && new Date() > coupon.validUntil) {
          return false
        }

        set({ coupon })
        return true
      },
    }),
    {
      name: 'spice-grill-cart-storage',
      // Only persist items, currency, and tax rate - not order details
      partialize: (state) => ({
        items: state.items,
        currency: state.currency,
        taxRate: state.taxRate,
        shippingMethod: state.shippingMethod,
        coupon: state.coupon,
      }),
    }
  )
)
