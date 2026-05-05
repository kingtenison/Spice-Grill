"use client";

import { useEffect, useState } from "react";
import { Search, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  profiles: { full_name: string };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/orders");
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredOrders = orders.filter(
    (o) => o.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           o.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold mb-1 text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage and track all customer orders.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-gray-200 font-medium outline-none focus:border-red-500 transition-all"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <th className="px-6 py-5">Order ID</th>
              <th className="px-6 py-5">Customer</th>
              <th className="px-6 py-5">Date</th>
              <th className="px-6 py-5">Total</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded" />
                    ))}
                  </div>
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No orders found
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-5 font-bold text-gray-900">#{order.id.slice(-5)}</td>
                  <td className="px-6 py-5 text-gray-900">{order.profiles?.full_name || "—"}</td>
                  <td className="px-6 py-5 text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5 font-bold text-gray-900">{formatCurrency(order.total_amount)}</td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "text-[10px] font-black uppercase px-2 py-1 rounded-lg",
                      order.status === "delivered" && "bg-green-100 text-green-600",
                      order.status === "pending" && "bg-orange-100 text-orange-600",
                      order.status === "preparing" && "bg-blue-100 text-blue-600",
                      order.status === "ready" && "bg-purple-100 text-purple-600",
                      order.status === "cancelled" && "bg-red-100 text-red-600"
                    )}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 rounded-lg hover:bg-gray-100 transition-all">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}