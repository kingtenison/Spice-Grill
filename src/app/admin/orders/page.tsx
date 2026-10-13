"use client";

import { useEffect, useState } from "react";
import { 
  Search, 
  MoreVertical, 
  CheckCircle, 
  RefreshCw, 
  Package, 
  Truck, 
  X, 
  Eye, 
  Clock, 
  ChefHat, 
  Navigation, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  User,
  ShoppingBag,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createAuthClientBrowser } from "@/lib/supabase/client";
import { toast } from "sonner";
import { notifyNewOrder, playNotificationSound } from "@/lib/notifications";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  menu_items?: {
    name: string;
  };
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  delivery_address?: string;
  profiles: { full_name: string };
  user_id?: string;
  customer_location?: { lat: number; lng: number; address: string };
  order_items?: OrderItem[];
  delivery_assignments?: {
    id: string;
    status: string;
    dispatcher_id?: string;
    dispatchers?: { name: string; phone: string };
  };
}

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Preparing", value: "preparing" },
  { label: "Ready", value: "ready" },
  { label: "In Transit", value: "out_for_delivery" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);

  const loadOrders = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      let res = await fetch("/api/admin/orders");
      if (!res.ok) {
        res = await fetch("/api/admin/orders?bypass=true");
      }

      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      } else {
        toast.error("Failed to load orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Network error while loading orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();

    // Set up real-time subscription for order updates
    const supabase = createAuthClientBrowser();
    const subscription = supabase
      .channel(`admin-orders-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          const updated = payload.new as Order;
          playNotificationSound("status_change");
          setOrders(currentOrders =>
            currentOrders.map(order =>
              order.id === updated.id
                ? { ...order, ...updated }
                : order
            )
          );
          // Also update modal order if currently open
          setSelectedOrder(current => current && current.id === updated.id ? { ...current, ...updated } : current);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          const newOrder = payload.new as Order;
          notifyNewOrder({
            id: newOrder.id,
            total_amount: newOrder.total_amount,
            customer_name: newOrder.profiles?.full_name,
          });
          setOrders(currentOrders => [newOrder, ...currentOrders]);
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(subscription);
      } catch {}
    };
  }, []);

  const formatCurrency = (amount: number) => `$${Number(amount || 0).toFixed(2)}`;

  const handleOrderAction = async (orderId: string, action: string) => {
    setProcessingOrder(orderId);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}?action=${action}`, {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to update order (${response.status})`);
      }

      // Update local state
      setOrders(prev => prev.map(order =>
        order.id === orderId
          ? { ...order, status: data.order?.status || action }
          : order
      ));

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: data.order?.status || action } : null);
      }

      toast.success(`Order updated: ${action.replace('_', ' ')}`);
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast.error(error.message || 'Failed to update order');
    } finally {
      setProcessingOrder(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200"><Clock className="w-3 h-3" /> Pending</span>;
      case "accepted":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200"><CheckCircle className="w-3 h-3" /> Accepted</span>;
      case "preparing":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200"><ChefHat className="w-3 h-3" /> Kitchen Prep</span>;
      case "ready":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200"><Package className="w-3 h-3" /> Ready</span>;
      case "out_for_delivery":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 border border-cyan-200"><Truck className="w-3 h-3" /> Out for Delivery</span>;
      case "delivered":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Delivered</span>;
      case "cancelled":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200"><XCircle className="w-3 h-3" /> Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 capitalize">{status}</span>;
    }
  };

  const renderActionButtons = (order: Order, isFullWidth = false) => {
    const isBusy = processingOrder === order.id;
    const btnClasses = cn(
      "min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
      isFullWidth && "flex-1"
    );

    switch (order.status) {
      case "pending":
        return (
          <div className={cn("flex items-center gap-2", isFullWidth && "w-full")}>
            <button
              onClick={() => handleOrderAction(order.id, "confirm")}
              disabled={isBusy}
              className={cn(btnClasses, "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20")}
            >
              <CheckCircle className="w-4 h-4" />
              Accept Order
            </button>
            <button
              onClick={() => handleOrderAction(order.id, "cancel")}
              disabled={isBusy}
              className={cn(btnClasses, "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200")}
            >
              <X className="w-4 h-4" />
              Reject
            </button>
          </div>
        );

      case "accepted":
        return (
          <div className={cn("flex items-center gap-2", isFullWidth && "w-full")}>
            <button
              onClick={() => handleOrderAction(order.id, "prepare")}
              disabled={isBusy}
              className={cn(btnClasses, "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20")}
            >
              <ChefHat className="w-4 h-4" />
              Start Cooking
            </button>
          </div>
        );

      case "preparing":
        return (
          <div className={cn("flex items-center gap-2", isFullWidth && "w-full")}>
            <button
              onClick={() => handleOrderAction(order.id, "ready")}
              disabled={isBusy}
              className={cn(btnClasses, "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20")}
            >
              <Package className="w-4 h-4" />
              Mark Ready
            </button>
          </div>
        );

      case "ready":
        return (
          <div className={cn("flex items-center gap-2", isFullWidth && "w-full")}>
            <button
              onClick={() => handleOrderAction(order.id, "pickup")}
              disabled={isBusy}
              className={cn(btnClasses, "bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-600/20")}
            >
              <Truck className="w-4 h-4" />
              Out for Delivery
            </button>
          </div>
        );

      case "out_for_delivery":
        return (
          <div className={cn("flex items-center gap-2", isFullWidth && "w-full")}>
            <button
              onClick={() => handleOrderAction(order.id, "deliver")}
              disabled={isBusy}
              className={cn(btnClasses, "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20")}
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark Delivered
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = 
      (o.profiles?.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (o.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.delivery_address || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Live Orders</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
              {filteredOrders.length}
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">Accept, track, and dispatch restaurant orders in real time.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50 min-h-[44px]"
          >
            <RefreshCw className={cn("w-4 h-4 text-slate-500", refreshing && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Bar (Horizontal scrollable on mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_FILTERS.map((f) => {
          const count = f.value === "all" 
            ? orders.length 
            : orders.filter(o => o.status === f.value).length;
          const isActive = statusFilter === f.value;

          return (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 min-h-[40px]",
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              )}
            >
              <span>{f.label}</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[11px]",
                isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by customer name, order #, or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-200 font-medium text-sm text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all shadow-sm"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Orders Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 bg-white rounded-2xl border border-slate-200 animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded w-1/3" />
              <div className="h-4 bg-slate-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No orders found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search terms or status filters."
              : "New customer orders will appear here automatically with live audio alerts."}
          </p>
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* MOBILE CARDS VIEW (Visible on mobile, hidden on tablet/desktop) */}
          {/* ======================================================== */}
          <div className="md:hidden space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3.5"
              >
                {/* Header: ID, Time & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-base">
                        #{order.id.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-slate-700 text-sm font-semibold">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.profiles?.full_name || "Guest User"}</span>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Amount & Items Preview */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Order Total</span>
                    <span className="text-base font-black text-slate-900">{formatCurrency(order.total_amount)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Items</span>
                    <span className="text-sm font-bold text-slate-700">
                      {order.order_items?.length ? `${order.order_items.length} items` : "Standard Meal"}
                    </span>
                  </div>
                </div>

                {/* Delivery Address */}
                {order.delivery_address && (
                  <div className="flex items-start gap-2 text-xs text-slate-600 bg-white">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-relaxed">{order.delivery_address}</span>
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="min-h-[44px] px-3.5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-4 h-4" />
                    Details
                  </button>
                  <div className="flex-1 flex gap-2">
                    {renderActionButtons(order, true)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ======================================================== */}
          {/* DESKTOP TABLE VIEW (Visible on md and up) */}
          {/* ======================================================== */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">Order ID</th>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Time & Date</th>
                    <th className="px-5 py-4">Total</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Delivery Address</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-900">
                        #{order.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {order.profiles?.full_name || "Guest Customer"}
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs">
                        <div>{new Date(order.created_at).toLocaleDateString()}</div>
                        <div className="font-medium text-slate-400">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-black text-slate-900">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-5 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-5 py-4 text-slate-600 text-xs max-w-xs truncate">
                        {order.delivery_address || "Pickup Order"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {renderActionButtons(order)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* ORDER DETAILS MODAL (Touch Friendly, Clean Breakdown) */}
      {/* ======================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">
                    Order #{selectedOrder.id.slice(-6).toUpperCase()}
                  </h3>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Placed on {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                aria-label="Close modal"
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Customer Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Customer</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    {selectedOrder.profiles?.full_name || "Guest Customer"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total</p>
                  <p className="font-black text-slate-900 text-lg">
                    {formatCurrency(selectedOrder.total_amount)}
                  </p>
                </div>
              </div>

              {/* Delivery Address */}
              {selectedOrder.delivery_address && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Delivery Destination</h4>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5 text-sm text-slate-800">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{selectedOrder.delivery_address}</span>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Order Items</h4>
                {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                  <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
                    {selectedOrder.order_items.map((item, idx) => (
                      <div key={item.id || idx} className="p-3 bg-white flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-red-50 font-bold text-red-600 text-xs flex items-center justify-center">
                            {item.quantity}x
                          </span>
                          <span className="font-semibold text-slate-800">
                            {item.menu_items?.name || "Dish Item"}
                          </span>
                        </div>
                        <span className="font-bold text-slate-900">
                          {formatCurrency(item.unit_price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 text-center">
                    Standard order package. Check kitchen slip for special instructions.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex flex-wrap gap-2">
              <div className="flex-1 flex gap-2">
                {renderActionButtons(selectedOrder, true)}
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}