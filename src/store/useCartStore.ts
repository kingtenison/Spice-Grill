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
  validUntil?: string
}

export type OrderDetails = {
  deliveryAddress?: Address
  billingAddress?: Address
  deliveryMethod?: ShippingMethod
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
  deliveryMethod?: ShippingMethod
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
  getDeliveryCost: () => number
  getTaxAmount: () => number
  getDiscountAmount: () => number
  getTotal: () => number

  // Delivery & payment
  setDeliveryMethod: (method: ShippingMethod) => void
  setCoupon: (coupon: Coupon | undefined) => void
  setOrderDetails: (details: Partial<OrderDetails>) => void

  // Settings
  setCurrency: (currency: string) => void
  setTaxRate: (rate: number) => void

  // Validation
  validateCoupon: (code: string) => Promise<boolean>
}

const defaultDeliveryMethods: ShippingMethod[] = [
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
        deliveryMethod: undefined,
        orderDetails: undefined
      }),

      getSubtotal: () => {
        return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0)
      },

      getDeliveryCost: () => {
        return get().deliveryMethod?.cost || 0
      },

      getTaxAmount: () => {
        const subtotal = get().getSubtotal()
        const delivery = get().getDeliveryCost()
        const taxableAmount = subtotal + delivery
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
        const delivery = get().getDeliveryCost()
        const tax = get().getTaxAmount()
        const discount = get().getDiscountAmount()

        return Math.max(0, subtotal + delivery + tax - discount)
      },

      setDeliveryMethod: (method) => {
        set({ deliveryMethod: method })
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
        const subtotal = get().getSubtotal()

        try {
          const res = await fetch('/api/loyalty/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, subtotal }),
          })

          const data = await res.json()

          if (data.valid && data.coupon) {
            const validatedCoupon: Coupon = {
              code: data.coupon.code,
              discountType: data.coupon.discountType,
              discountValue: data.coupon.discountValue,
              description: data.coupon.description,
              minimumAmount: data.coupon.minimumAmount,
            }
            set({ coupon: validatedCoupon })
            return true
          }

          return false
        } catch (err) {
          console.error('Coupon validation failed:', err)
          return false
        }
      },
    }),
    {
      name: 'spice-grill-cart-storage',
      // Only persist items, currency, and tax rate - not order details
      partialize: (state) => ({
        items: state.items,
        currency: state.currency,
        taxRate: state.taxRate,
        deliveryMethod: state.deliveryMethod,
        coupon: state.coupon,
      }),
    }
  )
)
