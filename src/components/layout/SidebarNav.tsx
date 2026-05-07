"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, LogOut, Home, UtensilsCrossed, Award, BookOpen, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

export function SidebarNav() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const pathname = usePathname();

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
    { href: "/", label: "Home", icon: Home },
    { href: "/menu", label: "Menu", icon: UtensilsCrossed },
    { href: "/loyalty", label: "Rewards", icon: Award },
    { href: "/blog", label: "Story", icon: BookOpen },
    { href: "/orders", label: "Orders", icon: History },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Floating Sidebar */}
      <aside
        className={cn(
          "hidden lg:block fixed left-0 top-1/2 -translate-y-1/2 z-40",
          "bg-white/95 backdrop-blur-xl border border-gray-200 rounded-r-2xl shadow-xl",
          "transition-all duration-300 ease-in-out w-14 px-2 py-4"
        )}
      >
        {/* Navigation Links */}
        <nav className="space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            
            return (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={() => setHoveredItem(link.href)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link
                  href={link.href}
                  className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-lg text-sm transition-all duration-200",
                    active
                      ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                      : "text-gray-700 hover:bg-gray-100 hover:text-red-600"
                  )}
                >
                  <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-white" : "text-gray-500")} />
                </Link>
                
                {/* Tooltip */}
                <AnimatePresence>
                  {hoveredItem === link.href && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap pointer-events-none"
                    >
                      {link.label}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div
            className="relative"
            onMouseEnter={() => setHoveredItem("account")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {user ? (
              <Link
                href="/account"
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                )}
              >
                <User className="w-4 h-4 flex-shrink-0" />
              </Link>
            ) : (
              <Link
                href="/login"
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                )}
              >
                <User className="w-4 h-4 flex-shrink-0" />
              </Link>
            )}
            
            {/* Tooltip */}
            <AnimatePresence>
              {hoveredItem === "account" && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap pointer-events-none"
                >
                  {user ? "My Account" : "Login"}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {user && (
            <div
              className="relative mt-1.5"
              onMouseEnter={() => setHoveredItem("logout")}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <button
                onClick={handleLogout}
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                )}
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
              </button>
              
              {/* Tooltip */}
              <AnimatePresence>
                {hoveredItem === "logout" && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap pointer-events-none"
                  >
                    Logout
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}