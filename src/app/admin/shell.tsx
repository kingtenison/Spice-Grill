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
  Megaphone,
  Truck,
  ClipboardCheck,
  Package,
  Award,
  Menu as MenuIcon,
  X,
  ChevronRight,
  ShieldCheck,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "@/app/actions/auth";
import { NotificationCenter } from "@/components/admin/NotificationCenter";

interface NavGroup {
  title: string;
  items: {
    label: string;
    href: string;
    icon: any;
    badge?: string;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Operations",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Live Orders", href: "/admin/orders", icon: ShoppingBag },
      { label: "Menu Management", href: "/admin/menu", icon: UtensilsCrossed },
      { label: "Inventory Stock", href: "/admin/inventory", icon: Package },
      { label: "Delivery Fleet", href: "/admin/delivery", icon: Truck },
      { label: "Dispatcher Apps", href: "/admin/dispatcher-applications", icon: ClipboardCheck },
    ]
  },
  {
    title: "Finance & Growth",
    items: [
      { label: "Financial Ledger", href: "/admin/financial", icon: BarChart3 },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { label: "Customers CRM", href: "/admin/customers", icon: Users },
      { label: "Loyalty Program", href: "/admin/loyalty", icon: Award },
      { label: "Customer Reviews", href: "/admin/reviews", icon: Star },
      { label: "Stories & Blog", href: "/admin/blog", icon: BookOpen },
      { label: "Marketing", href: "/admin/marketing", icon: Megaphone },
    ]
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ]
  }
];

// Flat list for quick matching
const ALL_NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items);

// Mobile primary bottom tabs
const BOTTOM_NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Menu", href: "/admin/menu", icon: UtensilsCrossed },
  { label: "Delivery", href: "/admin/delivery", icon: Truck },
];

interface AdminShellProps {
  children: React.ReactNode;
  profile: { role: string; full_name: string; email?: string } | null;
}

export default function AdminShell({ children, profile }: AdminShellProps) {
  const pathname = usePathname();
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState("");

  const isCurrentActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const filteredGroups = drawerSearch.trim()
    ? NAV_GROUPS.map(g => ({
        ...g,
        items: g.items.filter(item => 
          item.label.toLowerCase().includes(drawerSearch.toLowerCase())
        )
      })).filter(g => g.items.length > 0)
    : NAV_GROUPS;

  return (
    <div className="min-h-screen bg-slate-50/60 flex">
      {/* ======================================================== */}
      {/* DESKTOP SIDEBAR (Permanent, Fixed Left, Full Height) */}
      {/* ======================================================== */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-40 bg-slate-900 border-r border-slate-800 text-slate-100 shadow-xl">
        {/* Brand / Logo Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
              <span className="font-black text-white text-lg">SG</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-base tracking-tight">Spice Grille</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                  OS
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-slate-400 font-medium">System Online</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Categories */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isCurrentActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group",
                        active
                          ? "bg-red-600 text-white font-semibold shadow-md shadow-red-600/25"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={cn("w-4 h-4 shrink-0 transition-colors", active ? "text-white" : "text-slate-400 group-hover:text-slate-200")} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                          active ? "bg-white text-red-600" : "bg-red-500/20 text-red-400"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Card & Sign Out */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-800/50 border border-slate-700/40 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm">
                {profile?.full_name?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-100 truncate">{profile?.full_name || "Admin User"}</p>
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-red-400" />
                  <span className="text-[10px] text-slate-400 capitalize">{profile?.role || "Administrator"}</span>
                </div>
              </div>
            </div>
            <Link
              href="/"
              target="_blank"
              title="View Public Store"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-red-600/20 hover:border-red-500/30 border border-transparent transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MOBILE TOP HEADER (Fixed on mobile, hidden on desktop) */}
      {/* ======================================================== */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowMobileDrawer(true)}
            aria-label="Open Navigation Menu"
            className="w-10 h-10 rounded-xl bg-slate-100 active:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center shadow-sm">
              <span className="font-extrabold text-white text-xs">SG</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm leading-none block">Spice Grille</span>
              <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Admin Panel</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationCenter />
          <div className="w-8 h-8 rounded-full bg-red-100 border border-red-200 flex items-center justify-center font-bold text-red-600 text-xs">
            {profile?.full_name?.[0]?.toUpperCase() || "A"}
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* MOBILE SLIDE-OUT DRAWER */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showMobileDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowMobileDrawer(false)}
              className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 260 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-slate-900 z-50 text-white flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-md">
                    <span className="font-black text-white text-sm">SG</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-base">Spice Grille OS</h2>
                    <p className="text-[11px] text-slate-400">Admin Control Center</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileDrawer(false)}
                  aria-label="Close menu"
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Search Filter */}
              <div className="p-4 border-b border-slate-800/80">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={drawerSearch}
                    onChange={(e) => setDrawerSearch(e.target.value)}
                    placeholder="Search admin sections..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white placeholder-slate-400 outline-none focus:border-red-500 transition-colors"
                  />
                  {drawerSearch && (
                    <button
                      onClick={() => setDrawerSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Drawer Links */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                {filteredGroups.map((group) => (
                  <div key={group.title} className="space-y-1">
                    <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      {group.title}
                    </p>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isCurrentActive(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setShowMobileDrawer(false)}
                            className={cn(
                              "flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-150 min-h-[44px]",
                              active
                                ? "bg-red-600 text-white font-bold shadow-md shadow-red-600/25"
                                : "text-slate-300 active:bg-slate-800"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={cn("w-4 h-4 shrink-0", active ? "text-white" : "text-slate-400")} />
                              <span>{item.label}</span>
                            </div>
                            <ChevronRight className={cn("w-4 h-4", active ? "text-white/80" : "text-slate-600")} />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
                <div className="flex items-center gap-3 px-2 py-1">
                  <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center font-bold text-red-400 text-sm">
                    {profile?.full_name?.[0]?.toUpperCase() || "A"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{profile?.full_name || "Administrator"}</p>
                    <p className="text-xs text-slate-400">{profile?.email || "Admin Access"}</p>
                  </div>
                </div>

                <form action={signOut}>
                  <button
                    type="submit"
                    onClick={() => setShowMobileDrawer(false)}
                    className="w-full flex items-center justify-center gap-2 min-h-[44px] py-2.5 rounded-xl text-sm font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MAIN WRAPPER */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Desktop Top Header */}
        <header className="hidden lg:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Quick search orders, menu items..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white text-sm outline-none transition-all placeholder-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Storefront
            </Link>
            <div className="h-6 w-px bg-slate-200" />
            <NotificationCenter />
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 leading-tight">{profile?.full_name || "Admin"}</p>
                <p className="text-[11px] text-slate-500 font-medium capitalize">{profile?.role || "Owner"}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center font-bold text-white shadow-sm">
                {profile?.full_name?.[0]?.toUpperCase() || "A"}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content: pt-16 on mobile for top bar, pb-28 on mobile for bottom nav */}
        <main className="flex-1 pt-20 lg:pt-8 pb-28 lg:pb-12 px-3 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* ======================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Fixed, High Priority Tabs) */}
      {/* ======================================================== */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 safe-area-bottom shadow-lg">
        <div className="grid grid-cols-5 h-16">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isCurrentActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 min-h-[48px] transition-colors",
                  active ? "text-red-600" : "text-slate-500 active:text-slate-900"
                )}
              >
                <Icon className={cn("w-5 h-5", active ? "text-red-600 stroke-[2.2]" : "text-slate-500")} />
                <span className={cn(
                  "text-[10px] font-bold tracking-tight",
                  active ? "text-red-600" : "text-slate-600"
                )}>
                  {item.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="mobileActiveTabIndicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-red-600 rounded-full"
                  />
                )}
              </Link>
            );
          })}

          {/* More Drawer Button */}
          <button
            onClick={() => setShowMobileDrawer(true)}
            aria-label="Open more menu"
            className="relative flex flex-col items-center justify-center gap-1 min-h-[48px] text-slate-500 active:text-slate-900 transition-colors"
          >
            <MenuIcon className="w-5 h-5 text-slate-500" />
            <span className="text-[10px] font-bold tracking-tight text-slate-600">
              More
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}