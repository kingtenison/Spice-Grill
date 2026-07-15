"use client";

import Link from "next/link";
import { User, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };

    checkAuth();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { setUser(session.user); }
      else { setUser(null); }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-gray-200 py-3 shadow-sm"
          : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
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

          {/* Right side — Order Now + Login/Account */}
          <div className="flex items-center gap-2">
            <Link
              href="/menu"
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors rounded-xl shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Order Now</span>
            </Link>

            {user ? (
              <Link
                href="/account"
                className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-700 hover:bg-gray-100 hover:text-red-600 transition-colors"
              >
                <User className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-red-600 transition-colors rounded-xl"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
