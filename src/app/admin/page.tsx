"use client";

import { useEffect, useState } from "react";
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

  return (
<div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold mb-2 text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))
        ) : stats ? (
          <>
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-600">
                  <ArrowUpRight className="w-3 h-3" />
                  12.5%
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
              <h3 className="text-2xl font-black text-gray-900">{formatCurrency(stats.totalRevenue)}</h3>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-600">
                  <ArrowUpRight className="w-3 h-3" />
                  8.2%
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Orders</p>
              <h3 className="text-2xl font-black text-gray-900">{stats.totalOrders}</h3>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-600">
                  <ArrowDownRight className="w-3 h-3" />
                  3.1%
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">New Customers</p>
              <h3 className="text-2xl font-black text-gray-900">{stats.totalCustomers}</h3>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-600">
                  <ArrowUpRight className="w-3 h-3" />
                  4.3%
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Avg. Order Value</p>
              <h3 className="text-2xl font-black text-gray-900">{formatCurrency(stats.avgOrderValue)}</h3>
            </div>
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            <button className="text-sm font-bold text-red-500 hover:underline">View All</button>
          </div>
          
          <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Order ID</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Customer</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Items</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Total</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
<tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => {
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-sm text-gray-900">#{order.id.slice(-5)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.profiles?.full_name || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">1</td>
                      <td className="px-6 py-4 font-bold text-sm text-gray-900">{formatCurrency(order.total_amount)}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] font-black uppercase px-2 py-1 rounded-lg",
                          order.status === "pending" && "bg-orange-100 text-orange-600",
                          order.status === "preparing" && "bg-blue-100 text-blue-600",
                          order.status === "ready" && "bg-purple-100 text-purple-600",
                          order.status === "delivered" && "bg-green-100 text-green-600",
                        )}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
               {recentOrders.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No recent orders found
                      </td>
                    </tr>
                  )}
               </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed / Top Items */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Live Activity</h2>
          <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm space-y-6">
            {[1, 2, 3, 4].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">New order received from <span className="font-bold">Amara Okeke</span></p>
                  <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
                </div>
              </div>
            ))}
            <button className="w-full py-3 rounded-xl border border-dashed border-gray-200 text-xs font-bold text-gray-500 hover:border-red-500/50 hover:text-red-500 transition-all">
              View All Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
