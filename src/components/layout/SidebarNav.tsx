"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, LogOut, Home, UtensilsCrossed, Award, BookOpen, History, Truck, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createClient, safeGetUser } from "@/lib/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

export function SidebarNav() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isApprovedDispatcher, setIsApprovedDispatcher] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setUserRole(data.role);
          setIsApprovedDispatcher(!!data.isApprovedDispatcher);
        } else {
          setUser(null);
          setUserRole(null);
          setIsApprovedDispatcher(false);
        }
      } catch (err) {
        console.warn("[SidebarNav] Auth check failed:", err);
        setUser(null);
        setUserRole(null);
      }
    };

    checkAuth();

    const supabase = createClient();
    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange(async (_event: any, session: any) => {
      if (session?.user) {
        setUser(session.user);
        checkAuth(); // refresh roles and statuses safely
      } else {
        setUser(null);
        setUserRole(null);
        setIsApprovedDispatcher(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Signout timeout")), 3000))
      ]);
    } catch (err) {
      console.warn("SidebarNav sign out timed out or failed:", err);
    }
    // Clear cookies manually to ensure session is cleared locally
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
    window.location.href = '/';
  };

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/menu", label: "Menu", icon: UtensilsCrossed },
    { href: "/loyalty", label: "Rewards", icon: Award },
    { href: "/blog", label: "Story", icon: BookOpen },
    { href: "/orders", label: "Orders", icon: History },
  ];

  const adminLinks = [
    { href: "/admin/delivery", label: "Delivery Dashboard", icon: Truck },
  ];

  const userLinks = [
    { href: "/account", label: "Track Order", icon: MapPin },
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

          {/* Admin/Employee Delivery Link */}
          {(userRole === 'admin' || userRole === 'employee') && adminLinks.map((link) => {
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

          {/* User Track Order Link */}
          {user && userLinks.map((link) => {
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

          {/* Delivery Section - Always visible with dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setHoveredItem("delivery-menu")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div
              className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-lg text-sm transition-all duration-200 cursor-pointer",
                "text-gray-700 hover:bg-gray-100 hover:text-red-600"
              )}
            >
              <Truck className="w-4 h-4 flex-shrink-0" />
            </div>
            
            {/* Delivery Dropdown */}
            <AnimatePresence>
              {hoveredItem === "delivery-menu" && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50"
                >
                  <div className="space-y-1">
                    {user && (
                      <Link
                        href="/account"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors text-sm"
                      >
                        <MapPin className="w-4 h-4" />
                        <span>Track Order</span>
                      </Link>
                    )}
                    
                    {isApprovedDispatcher ? (
                      <Link
                        href="/dispatcher"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors text-sm"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Dispatcher Portal</span>
                      </Link>
                    ) : user ? (
                      <Link
                        href="/dispatcher/register"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors text-sm"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Become Dispatcher</span>
                      </Link>
                    ) : null}
                    
                    {(userRole === 'admin' || userRole === 'employee') && (
                      <>
                        <Link
                          href="/admin/delivery"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors text-sm"
                        >
                          <Truck className="w-4 h-4" />
                          <span>Delivery Dashboard</span>
                        </Link>
                        
                        {userRole === 'admin' && (
                          <Link
                            href="/admin/dispatcher-applications"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors text-sm"
                          >
                            <User className="w-4 h-4" />
                            <span>Applications</span>
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* User Section */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          {/* Account/Login */}
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