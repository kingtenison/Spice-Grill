"use client";

import { useState, useEffect } from "react";
import { 
  Clock, 
  MapPin, 
  CheckCircle2,
  Clock4,
  Truck,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createAuthClientBrowser } from "@/lib/supabase/client";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  menu_items?: {
    name: string;
  }[];
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  shipping_address?: any;
  special_instructions?: string;
  order_items: OrderItem[];
}

export default function EmployeeDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const supabase = createAuthClientBrowser();

  const fetchActiveOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        created_at,
        total_amount,
        status,
        shipping_address,
        special_instructions,
        order_items (
          id,
          quantity,
          unit_price,
          menu_items (name)
        )
      `)
      .in("status", ["pending", "accepted", "preparing", "ready"])
      .order("created_at", { ascending: true });

    if (!error && data) {
      setOrders(data as Order[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActiveOrders();

    // Real-time subscription for order updates
    const channel = supabase
      .channel("employee-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: "status=in.(pending,accepted,preparing,ready)"
        },
        () => {
          fetchActiveOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateOrderStatus = async (orderId: string, action: string) => {
    setUpdating(orderId);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}?action=${action}`, {
        method: "PATCH",
      });

      if (res.ok) {
        // Optimistic update + refetch
        await fetchActiveOrders();
      } else {
        const err = await res.json();
        alert("Failed to update order: " + (err.error || "Unknown error"));
      }
    } catch (e) {
      alert("Error updating order");
    } finally {
      setUpdating(null);
    }
  };

  const getStatusConfig = (status: string) => {
    const s = status.toLowerCase();
    if (s === "pending") return { icon: Clock4, color: "bg-orange-100 text-orange-600", next: "Accept", action: "confirm" };
    if (s === "accepted") return { icon: Clock4, color: "bg-blue-100 text-blue-600", next: "Start Preparing", action: "prepare" };
    if (s === "preparing") return { icon: Clock4, color: "bg-purple-100 text-purple-600", next: "Mark Ready", action: "ready" };
    if (s === "ready") return { icon: CheckCircle2, color: "bg-green-100 text-green-600", next: "Out for Delivery", action: "deliver" };
    return { icon: Truck, color: "bg-gray-100 text-gray-600", next: "Complete", action: "deliver" };
  };

  const getTimeAgo = (dateString: string) => {
    const minutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
    return minutes < 1 ? "just now" : `${minutes} min ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  const activeOrders = orders.filter(o => ["pending", "accepted", "preparing", "ready"].includes(o.status));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-gray-900">Active Orders</h1>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-bold">
          <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
          {activeOrders.length} Active
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <AnimatePresence>
          {activeOrders.map((order) => {
            const config = getStatusConfig(order.status);
            const customerName = order.shipping_address?.name || "Guest";
            const address = order.shipping_address 
              ? `${order.shipping_address.street}, ${order.shipping_address.city}` 
              : "No address";

            return (
              <motion.div 
                layout
                key={order.id}
                className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl font-black text-red-600">#{order.id.slice(0, 8)}</span>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                        config.color
                      )}>
                        {order.status}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{customerName}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                      <Clock className="w-4 h-4" /> {getTimeAgo(order.created_at)}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  {order.order_items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-red-50/40">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-black text-red-600 shadow-sm">
                          {item.quantity}
                        </div>
                        <span className="font-bold text-lg text-gray-900">{item.menu_items?.[0]?.name || "Item"}</span>
                      </div>
                      <span className="font-medium text-gray-600">${(item.unit_price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1 text-gray-500 shrink-0" />
                    <p className="text-xs font-medium text-gray-500 line-clamp-2">{address}</p>
                  </div>
                  <div className="flex items-center justify-end font-black text-xl text-gray-900">
                    ${Number(order.total_amount).toFixed(2)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => updateOrderStatus(order.id, "cancel")}
                    disabled={!!updating}
                    className="py-4 rounded-2xl bg-red-50 text-gray-600 font-bold hover:bg-red-100 transition-all disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => updateOrderStatus(order.id, config.action)}
                    disabled={!!updating}
                    className="py-4 rounded-2xl bg-red-600 text-white font-black text-lg shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {updating === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : config.next}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {activeOrders.length === 0 && (
        <div className="py-32 text-center">
          <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-gray-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">All caught up!</h3>
          <p className="text-gray-600 mt-2">New orders will appear here automatically.</p>
        </div>
      )}
    </div>
  );
}


function ChefHat(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 18 6-6 6 6" />
      <path d="M12 2v10" />
      <path d="M17 18a2 2 0 0 0 0-4H7a2 2 0 0 0 0 4" />
      <path d="M6 14v4" />
      <path d="M18 14v4" />
    </svg>
  );
}
