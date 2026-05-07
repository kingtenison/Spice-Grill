"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingBag, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Bell,
  Search,
  BookOpen,
  Star,
  Megaphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "@/app/actions/auth";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Menu", href: "/admin/menu", icon: UtensilsCrossed },
  { label: "Blog", href: "/admin/blog", icon: BookOpen },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Marketing", href: "/admin/marketing", icon: Megaphone },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

interface AdminShellProps {
  children: React.ReactNode;
  profile: { role: string; full_name: string; email?: string } | null;
}

export default function AdminShell({ children, profile }: AdminShellProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      {/* Desktop Floating Sidebar */}
      <aside
        className={cn(
          "hidden lg:block fixed left-0 top-1/2 -translate-y-1/2 z-40",
          "bg-white/95 backdrop-blur-xl border border-gray-200 rounded-r-2xl shadow-xl",
          "transition-all duration-300 ease-in-out w-14 px-2 py-4"
        )}
      >
        <nav className="space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            
            return (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                      : "text-gray-700 hover:bg-gray-100 hover:text-red-600"
                  )}
                >
                  <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-white" : "text-gray-500")} />
                </Link>
                
                <AnimatePresence>
                  {hoveredItem === item.href && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap pointer-events-none"
                    >
                      {item.label}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div className="mt-4 pt-3 border-t border-gray-200">
          <div
            className="relative"
            onMouseEnter={() => setHoveredItem("logout")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <form action={signOut}>
              <button
                type="submit"
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium",
                  "text-gray-700 hover:bg-gray-100 hover:text-red-600 transition-all duration-200"
                )}
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
              </button>
            </form>
            
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
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200 h-16 flex items-center justify-between px-4">
        <button
          onClick={() => setShowMobileMenu(true)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h2 className="font-bold text-gray-900">Spice Grill OS</h2>
        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-all">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white"></span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white z-50 flex flex-col"
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-extrabold text-lg text-gray-900">Spice Grill OS</h2>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Admin Panel</span>
              </div>
              
              <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowMobileMenu(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                        isActive 
                          ? "bg-red-500 text-white shadow-lg shadow-red-500/20" 
                          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              
              <div className="p-4 border-t">
                <form action={signOut}>
                  <button 
                    type="submit"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-grow flex flex-col min-w-0 lg:ml-0">
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 bg-white border-b items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-grow max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search orders, menu..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white transition-all outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{profile?.full_name || "Admin"}</p>
                <p className="text-[10px] text-gray-500 font-medium uppercase">Owner</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-red-100 border border-red-200 overflow-hidden flex items-center justify-center font-black text-red-500">
                {profile?.full_name?.[0] || "A"}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow pt-16 lg:pt-0 px-4 lg:px-8 pb-20 lg:pb-8 bg-white">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200">
        <div className="grid grid-cols-5 h-16">
          {NAV_ITEMS.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 transition-colors",
                  isActive ? "text-red-600" : "text-gray-600 hover:text-red-600"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-red-600" : "text-gray-600"
                )}>
                  {item.label.split(' ')[0]}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="adminMobileIndicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-red-600 rounded-full"
                  />
                )}
              </Link>
            );
          })}
          
          <button
            onClick={() => setShowMobileMenu(true)}
            className="relative flex flex-col items-center justify-center gap-1 transition-colors text-gray-600 hover:text-red-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-[10px] font-medium text-gray-600">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}