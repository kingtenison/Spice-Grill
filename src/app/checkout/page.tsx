"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useCartStore } from "@/store/useCartStore";
import {
  Minus, Plus, Trash2, ArrowRight, MapPin, Clock,
  CreditCard, ShoppingBag, ArrowLeft, CheckCircle
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

type OrderType = "delivery" | "pickup";

export default function CheckoutPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [details, setDetails] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });

  const subtotal = getTotal();
  const deliveryFee = orderType === "delivery" ? 3.99 : 0;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + deliveryFee + tax;

  const handlePlaceOrder = async () => {
    if (!details.name || !details.phone || (orderType === "delivery" && !details.address)) {
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    try {
      // Create order in Supabase
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: total,
          delivery_address: orderType === "delivery" ? details.address : null,
          special_instructions: details.notes || null,
          status: "pending",
          payment_status: "pending",
        })
        .select()
        .single();

      if (order && !error) {
        // Insert order items
        const orderItems = items.map((item) => ({
          order_id: order.id,
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        }));

        await supabase.from("order_items").insert(orderItems);

        setOrderId(order.id);
        setOrderPlaced(true);
        clearCart();
      }
    } catch (error) {
      console.error("Error placing order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container px-4 py-20 mx-auto max-w-lg text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="p-12 rounded-2xl bg-white border border-gray-200 shadow-xl"
          >
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4 text-gray-900">Order Placed!</h1>
            <p className="text-gray-600 mb-2">Your order has been received and is being prepared.</p>
            <p className="text-sm font-bold text-red-600 uppercase tracking-widest mb-8">
              Order #{orderId.slice(0, 8).toUpperCase()}
            </p>
            <div className="space-y-3">
              <Link
                href="/orders"
                className="block w-full py-4 rounded-xl bg-red-600 text-white font-bold text-lg shadow-lg shadow-red-500/20 hover:bg-red-700 transition-colors"
              >
                Track Order
              </Link>
              <Link
                href="/menu"
                className="block w-full py-4 rounded-xl bg-gray-100 text-gray-900 font-semibold hover:bg-gray-200 transition-colors"
              >
                Back to Menu
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container px-4 py-12 mx-auto max-w-5xl">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/cart"
            className="p-2 rounded-lg bg-white border border-gray-200 hover:border-red-600 hover:text-red-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Type */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Order Type</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setOrderType("delivery")}
                  className={`p-4 rounded-xl border-2 font-semibold transition-all ${
                    orderType === "delivery"
                      ? "border-red-600 bg-red-50 text-red-600"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <MapPin className="w-6 h-6 mx-auto mb-2" />
                  Delivery
                </button>
                <button
                  onClick={() => setOrderType("pickup")}
                  className={`p-4 rounded-xl border-2 font-semibold transition-all ${
                    orderType === "pickup"
                      ? "border-red-600 bg-red-50 text-red-600"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Clock className="w-6 h-6 mx-auto mb-2" />
                  Pickup
                </button>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={details.name}
                    onChange={(e) => setDetails({ ...details, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-colors text-gray-900"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={details.phone}
                    onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-colors text-gray-900"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {orderType === "delivery" && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address</label>
                  <textarea
                    value={details.address}
                    onChange={(e) => setDetails({ ...details, address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-colors text-gray-900 resize-none"
                    placeholder="123 Grill Street, New York, NY 10001"
                  />
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions (Optional)</label>
                <textarea
                  value={details.notes}
                  onChange={(e) => setDetails({ ...details, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-colors text-gray-900 resize-none"
                  placeholder="Extra napkins, specific cooking instructions..."
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 p-6 rounded-2xl bg-white border border-gray-200 shadow-lg">
              <h2 className="text-xl font-bold mb-6 text-gray-900">Order Summary</h2>

              {/* Items */}
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-semibold">{deliveryFee > 0 ? `$${deliveryFee.toFixed(2)}` : "Free"}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (8%)</span>
                  <span className="font-semibold">${tax.toFixed(2)}</span>
                </div>
                <div className="h-[1px] bg-gray-200 my-3" />
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting || items.length === 0}
                className="w-full mt-6 py-4 rounded-xl bg-red-600 text-white font-bold text-lg hover:bg-red-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
              >
                {isSubmitting ? "Placing Order..." : `Place Order - $${total.toFixed(2)}`}
              </button>

              <p className="mt-4 text-xs text-center text-gray-500">
                By placing your order, you agree to our Terms & Conditions
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}