"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/store/useCartStore";
import { getMenuItemImage } from "@/lib/utils";
import {
  Trash2, Plus, Minus, ArrowRight, ShoppingBag, Tag, Percent,
  Star, Truck, Shield, Gift, LogIn, ChevronRight, X, ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createAuthClientBrowser } from "@/lib/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

/* ─── Login Prompt (full page for guests) ─── */

const loginBenefits = [
  { icon: Star, title: "Loyalty Rewards", description: "Earn points on every order" },
  { icon: Truck, title: "Live Order Tracking", description: "From kitchen to doorstep" },
  { icon: Shield, title: "Saved Addresses", description: "Faster checkout next time" },
  { icon: Gift, title: "Member-Only Deals", description: "Exclusive coupons & specials" },
];

function LoginPromptPage() {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-amber-50/80 via-white to-white flex flex-col">
      <div className="flex-grow flex items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md"
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-400 to-red-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Star className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center mb-2">
            Sign in to unlock benefits
          </h1>
          <p className="text-sm sm:text-base text-gray-500 text-center mb-8 max-w-xs mx-auto">
            Free to join. Earn rewards on this order and every order after.
          </p>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-8">
            {loginBenefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.07, duration: 0.3 }}
                  className="flex flex-col items-center text-center p-3 sm:p-4 rounded-xl bg-white border border-gray-100 shadow-sm"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center mb-2">
                    <Icon className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight">{b.title}</p>
                  <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 leading-snug">{b.description}</p>
                </motion.div>
              );
            })}
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-2.5">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-red-600 text-white font-bold text-base hover:bg-red-700 transition-colors shadow-md shadow-red-500/20"
            >
              <LogIn className="w-4 h-4" />
              Sign In &amp; Get Benefits
            </Link>
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-base hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Create Account
            </Link>
          </div>

          {/* Guest checkout — separate section */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">Don&apos;t want to sign in? No problem.</p>
            <Link
              href="/checkout"
              className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-100 hover:border-gray-300 transition-colors"
            >
              Continue as Guest
              <ChevronRight className="w-4 h-4" />
            </Link>
            <p className="text-[11px] text-gray-400 text-center mt-2">
              You can always create an account later
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Cart Item Card ─── */

function CartItemCard({
  item,
  onUpdateQty,
  onRemove,
}: {
  item: ReturnType<typeof useCartStore.getState>["items"][0];
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);

  const handleRemove = () => {
    if (confirmRemove) {
      onRemove(item.id);
    } else {
      setConfirmRemove(true);
      setTimeout(() => setConfirmRemove(false), 3000);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="flex gap-3 p-3 sm:p-4">
        {/* Image */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
          <img
            src={getMenuItemImage(item)}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-grow min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-snug line-clamp-2 pr-6">
              {item.name}
            </h3>
            <p className="text-red-600 font-bold text-sm sm:text-base mt-0.5">
              ${item.price.toFixed(2)}
            </p>
          </div>

          <div className="flex items-center justify-between mt-2">
            {/* Qty controls */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-gray-50 border border-gray-200">
              <button
                onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white active:bg-gray-100 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5 text-gray-600" />
              </button>
              <span className="w-7 text-center font-bold text-sm text-gray-900 tabular-nums">
                {item.quantity}
              </span>
              <button
                onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white active:bg-gray-100 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>

            {/* Line total */}
            <p className="font-bold text-gray-900 text-sm tabular-nums">
              ${(item.price * item.quantity).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Remove row */}
      <div className="border-t border-gray-50 px-3 sm:px-4 py-2 flex items-center justify-between bg-gray-50/50">
        <button
          onClick={handleRemove}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
            confirmRemove
              ? "text-red-600"
              : "text-gray-400 hover:text-red-500"
          }`}
        >
          {confirmRemove ? (
            <>
              <X className="w-3.5 h-3.5" />
              Tap again to remove
            </>
          ) : (
            <>
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Cart Items View ─── */

function CartItemsView() {
  const {
    items,
    deliveryMethod,
    coupon,
    removeItem,
    updateQuantity,
    getSubtotal,
    getDeliveryCost,
    getTaxAmount,
    getDiscountAmount,
    getTotal,
    validateCoupon,
    setCoupon,
  } = useCartStore();

  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const subtotal = getSubtotal();
  const deliveryCost = getDeliveryCost();
  const taxAmount = getTaxAmount();
  const discountAmount = getDiscountAmount();
  const total = getTotal();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError("");
    const isValid = await validateCoupon(couponCode.trim());
    if (!isValid) {
      setCouponError("Invalid coupon or minimum order not met");
    } else {
      setCouponCode("");
    }
    setIsApplyingCoupon(false);
  };

  const handleRemoveCoupon = () => {
    setCoupon(undefined);
    setCouponCode("");
    setCouponError("");
  };

  /* ── Empty state ── */
  if (items.length === 0) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-5 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
            <ShoppingBag className="w-9 h-9 text-gray-300" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-sm text-gray-500 mb-6">
            Browse our menu and add something delicious.
          </p>
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors shadow-md shadow-red-500/20"
          >
            Browse Menu
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  /* ── Cart with items ── */
  return (
    <div className="min-h-screen bg-gray-50 pb-36 sm:pb-40 lg:pb-8">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 sm:pt-6 lg:pt-8">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-5 sm:mb-6">
          <Link
            href="/menu"
            className="p-2 -ml-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Back to menu"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Your Cart</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              {items.length} item{items.length !== 1 ? "s" : ""} · ${total.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-6 xl:gap-8">
          {/* ── Left: Items ── */}
          <div className="space-y-3 mb-5 lg:mb-0">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onUpdateQty={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </AnimatePresence>

            {/* Keep shopping link */}
            <Link
              href="/menu"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-dashed border-gray-300 text-gray-500 font-medium text-sm hover:border-red-300 hover:text-red-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add more items
            </Link>
          </div>

          {/* ── Right: Order Summary (desktop sidebar) ── */}
          <div className="hidden lg:block">
            <div className="sticky top-20 rounded-xl bg-white border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 text-base mb-4">Order Summary</h2>

              {/* Coupon */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Coupon Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 outline-none transition-colors"
                    disabled={!!coupon || isApplyingCoupon}
                  />
                  {!coupon ? (
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim() || isApplyingCoupon}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                    >
                      {isApplyingCoupon ? "…" : "Apply"}
                    </button>
                  ) : (
                    <button
                      onClick={handleRemoveCoupon}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
                {coupon && (
                  <div className="flex items-center gap-1.5 mt-1.5 p-2 bg-green-50 rounded-lg border border-green-100">
                    <Tag className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-xs text-green-700 font-medium">{coupon.description}</span>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900 tabular-nums">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Delivery</span>
                  <span className="font-medium text-gray-900 tabular-nums">
                    {deliveryCost === 0 ? <span className="text-green-600">Free</span> : `$${deliveryCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Tax</span>
                  <span className="font-medium text-gray-900 tabular-nums">${taxAmount.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1"><Percent className="w-3.5 h-3.5" />Discount</span>
                    <span className="font-medium tabular-nums">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-extrabold text-xl text-gray-900 tabular-nums">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Link
                href="/checkout"
                className="flex items-center justify-center gap-2 w-full mt-4 py-3.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors shadow-md shadow-red-500/20"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </Link>

              <p className="text-[11px] text-gray-400 text-center mt-3">
                Secure checkout · No hidden fees
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Mobile Sticky Bottom Bar ── */}
      <div className="lg:hidden fixed inset-x-0 bottom-16 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        {/* Coupon row (collapsible) */}
        <div className="px-4 pt-3 pb-1">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-xs font-medium text-gray-500 list-none select-none">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Have a coupon?
              </span>
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
            </summary>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 outline-none"
                disabled={!!coupon || isApplyingCoupon}
              />
              {!coupon ? (
                <button
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim() || isApplyingCoupon}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold disabled:bg-gray-200 disabled:text-gray-400"
                >
                  {isApplyingCoupon ? "…" : "Apply"}
                </button>
              ) : (
                <button onClick={handleRemoveCoupon} className="px-3 py-2 bg-gray-100 rounded-lg">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
            {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
            {coupon && (
              <div className="flex items-center gap-1.5 mt-1.5 p-2 bg-green-50 rounded-lg border border-green-100">
                <Tag className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs text-green-700 font-medium">{coupon.description}</span>
              </div>
            )}
          </details>
        </div>

        {/* Totals + CTA */}
        <div className="px-4 pb-4 pt-2">
          {/* Mini breakdown */}
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>
              Subtotal ${subtotal.toFixed(2)} · Delivery {deliveryCost === 0 ? "Free" : `$${deliveryCost.toFixed(2)}`} · Tax ${taxAmount.toFixed(2)}
            </span>
            {discountAmount > 0 && (
              <span className="text-green-600 font-medium">-${discountAmount.toFixed(2)}</span>
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] text-gray-400 leading-none">Total</p>
              <p className="text-lg font-extrabold text-gray-900 tabular-nums">${total.toFixed(2)}</p>
            </div>
            <Link
              href="/checkout"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors shadow-md shadow-red-500/20 max-w-[220px]"
            >
              Checkout
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Cart Page ─── */

export default function CartPage() {
  const { items } = useCartStore();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createAuthClientBrowser();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange(
      (_event: any, session: any) => {
        setUser(session?.user ?? null);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-7 h-7 border-[3px] border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return <CartItemsView />;
  return <LoginPromptPage />;
}
