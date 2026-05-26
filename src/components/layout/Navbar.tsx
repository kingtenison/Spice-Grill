"use client";

import Link from "next/link";
import { ShoppingBag, User, LogOut } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
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

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-30 transition-all duration-300 lg:hidden",
        isScrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-gray-200 py-3 shadow-sm"
          : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo - visible on mobile and when sidebar is collapsed */}
          <Link href="/" className="flex lg:hidden items-center gap-3">
            <img
              src="/Spice_Logo.jpg"
              alt="Spice Grille Logo"
              className="w-10 h-10 rounded-xl object-cover shadow-lg"
            />
            <span className="font-heading text-2xl font-bold text-gray-900">
              <span className="text-gray-900">SPICE</span>
              <span className="text-red-600">GRILLE</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link
              href="/menu"
              className="relative text-sm text-gray-700 hover:text-red-600 transition-colors group"
            >
              Menu
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="/loyalty"
              className="relative text-sm text-gray-700 hover:text-red-600 transition-colors group"
            >
              Rewards
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="/blog"
              className="relative text-sm text-gray-700 hover:text-red-600 transition-colors group"
            >
              Story
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300" />
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2.5 text-gray-700 hover:text-red-600 transition-colors rounded-xl hover:bg-gray-100"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* Auth - Desktop only */}
            <div className="hidden sm:flex items-center gap-2">
              {user ? (
                <>
                  <Link
                    href="/account"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-red-600 transition-colors rounded-xl hover:bg-gray-100"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden md:inline">My Account</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-red-600 transition-colors rounded-xl hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden md:inline">Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-red-600 transition-colors rounded-xl hover:bg-gray-100"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden md:inline">Login</span>
                </Link>
              )}
            </div>

            {/* Order CTA - Desktop */}
            <Link
              href="/menu"
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-full bg-red-600 text-white hover:bg-red-700 transition-all duration-300 shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden md:inline">Order</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}