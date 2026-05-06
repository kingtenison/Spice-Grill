"use client";

import Link from "next/link";
import { ShoppingBag, User, LogOut, Menu, X, Flame } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

   useEffect(() => {
     const supabase = createClient();
     supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

     const { data: { subscription } } = (supabase.auth as any).onAuthStateChange((_event: any, session: any) => {
       setUser(session?.user ?? null);
     });

     return () => subscription.unsubscribe();
   }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const navLinks = [
    { href: "/menu", label: "Menu" },
    { href: "/loyalty", label: "Rewards" },
    { href: "/blog", label: "Story" },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-gray-200 py-3 shadow-sm"
          : "bg-transparent py-5"
      )}
    >
      <div className="container flex items-center justify-between px-4 mx-auto">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 group"
        >
          <motion.img
            whileHover={{ rotate: 5 }}
            src="/Spice_Logo.jpg"
            alt="Spice Grill Logo"
            className="w-10 h-10 rounded-xl object-cover shadow-lg"
          />
          <div className="flex flex-col">
            <span className="font-playfair text-2xl font-bold leading-none text-gray-900">
              <span className="text-gray-900">SPICE</span>
              <span className="text-red-600">GRILL</span>
            </span>
            <span className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">
              Est. 2024
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative text-sm font-medium text-gray-700 hover:text-red-600 transition-colors group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300" />
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Cart */}
          <Link
            href="/cart"
            className="relative p-2.5 text-gray-700 hover:text-red-600 transition-colors rounded-xl hover:bg-gray-100"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white"
              >
                {cartCount}
              </motion.span>
            )}
          </Link>

          {/* Auth */}
          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/account"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors rounded-xl hover:bg-gray-100"
              >
                <User className="w-4 h-4" />
                <span>My Account</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors rounded-xl hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors rounded-xl hover:bg-gray-100"
            >
              <User className="w-4 h-4" />
              <span>Login</span>
            </Link>
          )}

          {/* CTA */}
          <Link
            href="/menu"
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-full bg-red-600 text-white hover:bg-red-700 transition-all duration-300 shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Order</span>
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden relative p-2.5 text-gray-700 hover:text-red-600 transition-colors rounded-xl hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-white/95 backdrop-blur-xl border-b border-gray-200"
          >
            <div className="container px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-red-600 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                {user ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-base font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      <User className="w-5 h-5" />
                      My Account
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-base font-medium text-red-600 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-base font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <User className="w-5 h-5" />
                    Login
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}