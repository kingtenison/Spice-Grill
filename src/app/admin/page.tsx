"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreVertical,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  profiles: { full_name: string };
}

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  avgOrderValue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [statsRes, ordersRes, customersRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/orders/recent"),
          fetch("/api/admin/customers/count"),
        ]);

        const statsData = await statsRes.json();
        const ordersData = await ordersRes.json();
        const customersData = await customersRes.json();

        setStats({
          totalRevenue: statsData.totalRevenue || 0,
          totalOrders: statsData.totalOrders || 0,
          totalCustomers: customersData.count || 0,
          avgOrderValue: statsData.totalOrders > 0 
            ? statsData.totalRevenue / statsData.totalOrders 
            : 0,
        });
        setRecentOrders(ordersData.orders || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number) => `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getStatusTheme = (status: string) => {
    switch (status) {
      case "pending":
        return {
          cardBg: "bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600",
          borderColor: "border-amber-400/40",
          label: "Pending",
        };
      case "accepted":
      case "preparing":
        return {
          cardBg: "bg-gradient-to-br from-orange-500 via-red-500 to-rose-600",
          borderColor: "border-orange-400/40",
          label: "Cooking",
        };
      case "ready":
        return {
          cardBg: "bg-gradient-to-br from-purple-600 via-fuchsia-600 to-purple-800",
          borderColor: "border-purple-400/40",
          label: "Ready",
        };
      case "out_for_delivery":
        return {
          cardBg: "bg-gradient-to-br from-cyan-600 via-teal-600 to-blue-700",
          borderColor: "border-cyan-400/40",
          label: "In Transit",
        };
      case "delivered":
        return {
          cardBg: "bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800",
          borderColor: "border-emerald-400/40",
          label: "Delivered",
        };
      case "cancelled":
        return {
          cardBg: "bg-gradient-to-br from-rose-700 via-red-800 to-slate-900",
          borderColor: "border-rose-500/30",
          label: "Cancelled",
        };
      default:
        return {
          cardBg: "bg-gradient-to-br from-slate-700 to-slate-900",
          borderColor: "border-slate-600",
          label: status,
        };
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">Live restaurant metrics, incoming order tickets, and fleet activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/orders"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs sm:text-sm hover:bg-red-700 transition-all shadow-md shadow-red-600/20 active:scale-95 min-h-[42px]"
          >
            <ShoppingBag className="w-4 h-4" />
            Live Orders Board
          </Link>
        </div>
      </div>

      {/* Stats Grid - Strict 2x2 on Mobile, 4 Cols on Desktop with Full-Bleed Gradients */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4.5">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-200 animate-pulse space-y-3">
              <div className="h-8 bg-white/50 rounded-xl w-10 sm:w-12" />
              <div className="h-6 bg-white/40 rounded w-2/3" />
              <div className="h-4 bg-white/30 rounded w-1/2" />
            </div>
          ))
        ) : stats ? (
          <>
            {/* 1. Total Revenue (Emerald/Teal Gradient) */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white shadow-lg shadow-emerald-950/20 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-black px-2 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-emerald-100">
                  <ArrowUpRight className="w-3 h-3 text-emerald-200" />
                  +12.5%
                </div>
              </div>
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-100/80 mb-1">Total Revenue</p>
              <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">{formatCurrency(stats.totalRevenue)}</h3>
            </div>

            {/* 2. Total Orders (Blue/Indigo Gradient) */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white shadow-lg shadow-blue-950/20 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-black px-2 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-blue-100">
                  <ArrowUpRight className="w-3 h-3 text-blue-200" />
                  +8.2%
                </div>
              </div>
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-blue-100/80 mb-1">Total Orders</p>
              <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">{stats.totalOrders}</h3>
            </div>

            {/* 3. New Customers (Amber/Orange Gradient) */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white shadow-lg shadow-amber-950/20 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-black px-2 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-amber-100">
                  <ArrowUpRight className="w-3 h-3 text-amber-200" />
                  Active
                </div>
              </div>
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-100/80 mb-1">Registered Guests</p>
              <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">{stats.totalCustomers}</h3>
            </div>

            {/* 4. Avg. Order Value (Purple/Fuchsia Gradient) */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-purple-800 text-white shadow-lg shadow-purple-950/20 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-black px-2 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-purple-100">
                  <ArrowUpRight className="w-3 h-3 text-purple-200" />
                  +4.3%
                </div>
              </div>
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-purple-100/80 mb-1">Avg. Ticket Size</p>
              <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">{formatCurrency(stats.avgOrderValue)}</h3>
            </div>
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Recent Orders Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Recent Orders</h2>
              <p className="text-xs text-slate-500">Live order flow with immediate ticket access</p>
            </div>
            <Link 
              href="/admin/orders" 
              className="text-xs sm:text-sm font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-1.5 rounded-xl transition-all"
            >
              View All Orders →
            </Link>
          </div>
          
          {/* Mobile Recent Orders Cards: Strict 2x2 Grid with Full Status Gradients */}
          <div className="md:hidden grid grid-cols-2 gap-2.5">
            {recentOrders.map((order) => {
              const theme = getStatusTheme(order.status);
              return (
                <div 
                  key={order.id} 
                  className={cn(
                    "p-3 rounded-2xl text-white shadow-md flex flex-col justify-between border relative overflow-hidden min-h-[175px]",
                    theme.cardBg,
                    theme.borderColor
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <span className="font-black text-xs text-white/95 truncate">
                        #{order.id.slice(-5).toUpperCase()}
                      </span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-black/25 backdrop-blur-md border border-white/25 text-white shrink-0">
                        {theme.label}
                      </span>
                    </div>

                    <div className="bg-black/20 backdrop-blur-md rounded-xl p-2 border border-white/20 mb-2">
                      <p className="text-[11px] font-bold text-white truncate">
                        {order.profiles?.full_name || "Guest Customer"}
                      </p>
                      <p className="text-[10px] text-white/80 font-medium">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/20 flex flex-col gap-1.5">
                    <span className="font-black text-sm text-white">
                      {formatCurrency(order.total_amount)}
                    </span>
                    <Link
                      href="/admin/orders"
                      className="bg-white hover:bg-white/95 text-slate-900 font-black text-[11px] py-1.5 px-2 rounded-xl text-center shadow-sm transition-all min-h-[34px] flex items-center justify-center"
                    >
                      Manage Ticket
                    </Link>
                  </div>
                </div>
              );
            })}
            {recentOrders.length === 0 && !loading && (
              <div className="col-span-2 p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm shadow-sm">
                No recent orders found
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-sm">
            <table className="w-full text-left min-w-[540px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => {
                  const theme = getStatusTheme(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-black text-sm text-slate-900">
                        <Link href="/admin/orders" className="hover:text-red-600 transition-colors">
                          #{order.id.slice(-6).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">{order.profiles?.full_name || "Guest Customer"}</td>
                      <td className="px-6 py-4 font-black text-sm text-slate-900">{formatCurrency(order.total_amount)}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] font-black uppercase px-2.5 py-1 rounded-full text-white shadow-sm inline-block",
                          theme.cardBg
                        )}>
                          {theme.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href="/admin/orders" 
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 transition-all inline-flex items-center gap-1"
                        >
                          Details →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {recentOrders.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No recent orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed / Live Highlights */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Live Activity</h2>
            <p className="text-xs text-slate-500">Real-time alerts and operational events</p>
          </div>
          <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shrink-0 shadow-md shadow-red-500/20 text-white">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">Kitchen Audio System</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Real-time audio chime active for all incoming tickets.</p>
              </div>
            </div>

            <div className="flex gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 text-white">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">Order Queue Live</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Automated auto-refresh enabled on all admin boards.</p>
              </div>
            </div>

            <Link
              href="/admin/orders"
              className="block text-center w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95 min-h-[42px] flex items-center justify-center"
            >
              Open Kitchen KDS Board
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
