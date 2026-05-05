"use client";

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

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg leading-none text-gray-900">Spice Grill OS</h2>
              <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Admin Panel</span>
            </div>
          </div>
        </div>

        <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                  isActive 
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/20" 
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="px-4 py-3 mb-2">
            <p className="text-sm font-bold truncate text-gray-900">{profile?.full_name || "Admin"}</p>
            <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
          </div>
          <form action={signOut}>
            <button type="submit" className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all">
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-grow max-w-md">
            <div className="relative w-full hidden sm:block">
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
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">{profile?.full_name || "Admin"}</p>
                <p className="text-[10px] text-gray-500 font-medium uppercase">Owner</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-red-100 border border-red-200 overflow-hidden flex items-center justify-center font-black text-red-500">
                {profile?.full_name?.[0] || "A"}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow p-8 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
