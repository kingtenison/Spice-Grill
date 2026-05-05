"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useCartStore } from "@/store/useCartStore";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();
  const total = getTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container px-4 py-12 mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">Your Cart</h1>
          <span className="text-gray-600 font-medium">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  key={item.id}
                  className="flex items-center gap-6 p-6 rounded-2xl bg-white border border-gray-200 group shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    <img
                      src={item.image_url || item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-grow">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{item.name}</h3>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-xl font-extrabold text-red-600 mb-4">${item.price.toFixed(2)}</p>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 border border-gray-200">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 rounded hover:bg-white transition-colors"
                        >
                          <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="w-8 text-center font-bold text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 rounded hover:bg-white transition-colors"
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        Subtotal: <span className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {items.length === 0 && (
              <div className="py-24 text-center rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200">
                <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-2 text-gray-900">Your cart is empty</h3>
                <p className="text-gray-600 mb-6">Looks like you haven&apos;t added anything yet.</p>
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                >
                  Browse Menu <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            )}
          </div>

          {/* Order Summary */}
          {items.length > 0 && (
            <div className="lg:col-span-1">
              <div className="sticky top-28 p-8 rounded-2xl bg-white border border-gray-200 shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Order Summary</h2>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-900">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span className="text-green-600 font-bold">FREE</span>
                  </div>
                  <div className="h-[1px] bg-gray-200 my-4" />
                  <div className="flex justify-between text-2xl font-extrabold text-gray-900">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-red-600 text-white font-bold text-lg hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 hover:shadow-xl"
                >
                  Proceed to Checkout <ArrowRight className="w-6 h-6" />
                </Link>

                <p className="mt-6 text-center text-sm text-gray-500 italic">
                  No hidden fees. Direct from Spice Grill.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}