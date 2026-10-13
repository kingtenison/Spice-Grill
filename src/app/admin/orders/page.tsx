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
  Filter,
  LayoutGrid,
  List
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

  const getStatusTheme = (status: string) => {
    switch (status) {
      case "pending":
        return {
          gradientRibbon: "from-amber-400 via-orange-500 to-amber-600",
          cardBg: "bg-gradient-to-b from-amber-500/[0.07] via-white to-white",
          borderColor: "border-amber-200/90 hover:border-amber-400",
          glowColor: "bg-amber-400/25",
          badgeBg: "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-xs shadow-amber-500/25",
          label: "Pending",
        };
      case "accepted":
        return {
          gradientRibbon: "from-blue-500 via-indigo-500 to-cyan-500",
          cardBg: "bg-gradient-to-b from-blue-500/[0.07] via-white to-white",
          borderColor: "border-blue-200/90 hover:border-blue-400",
          glowColor: "bg-blue-400/25",
          badgeBg: "bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white shadow-xs shadow-blue-500/25",
          label: "Accepted",
        };
      case "preparing":
        return {
          gradientRibbon: "from-orange-500 via-red-500 to-amber-500",
          cardBg: "bg-gradient-to-b from-orange-500/[0.07] via-white to-white",
          borderColor: "border-orange-200/90 hover:border-orange-400",
          glowColor: "bg-orange-400/25",
          badgeBg: "bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 text-white shadow-xs shadow-orange-500/25",
          label: "Cooking",
        };
      case "ready":
        return {
          gradientRibbon: "from-purple-500 via-fuchsia-500 to-pink-500",
          cardBg: "bg-gradient-to-b from-purple-500/[0.07] via-white to-white",
          borderColor: "border-purple-200/90 hover:border-purple-400",
          glowColor: "bg-purple-400/25",
          badgeBg: "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white shadow-xs shadow-purple-500/25",
          label: "Ready",
        };
      case "out_for_delivery":
        return {
          gradientRibbon: "from-cyan-500 via-teal-500 to-blue-500",
          cardBg: "bg-gradient-to-b from-cyan-500/[0.07] via-white to-white",
          borderColor: "border-cyan-200/90 hover:border-cyan-400",
          glowColor: "bg-cyan-400/25",
          badgeBg: "bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 text-white shadow-xs shadow-cyan-500/25",
          label: "In Transit",
        };
      case "delivered":
        return {
          gradientRibbon: "from-emerald-500 via-teal-500 to-green-600",
          cardBg: "bg-gradient-to-b from-emerald-500/[0.05] via-white to-white",
          borderColor: "border-emerald-200/90 hover:border-emerald-400",
          glowColor: "bg-emerald-400/20",
          badgeBg: "bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white shadow-xs shadow-emerald-500/20",
          label: "Delivered",
        };
      case "cancelled":
        return {
          gradientRibbon: "from-rose-500 via-red-500 to-pink-600",
          cardBg: "bg-gradient-to-b from-rose-500/[0.05] via-white to-white",
          borderColor: "border-rose-200/90 hover:border-rose-400",
          glowColor: "bg-rose-400/20",
          badgeBg: "bg-gradient-to-r from-rose-600 via-red-600 to-pink-600 text-white shadow-xs shadow-rose-500/20",
          label: "Cancelled",
        };
      default:
        return {
          gradientRibbon: "from-slate-400 to-slate-500",
          cardBg: "bg-white",
          borderColor: "border-slate-200",
          glowColor: "bg-slate-300/20",
          badgeBg: "bg-slate-800 text-white",
          label: status,
        };
    }
  };

  const getStatusBadge = (status: string) => {
    const theme = getStatusTheme(status);
    const getIcon = () => {
      switch (status) {
        case "pending": return <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />;
        case "accepted": return <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />;
        case "preparing": return <ChefHat className="w-2.5 h-2.5 sm:w-3 sm:h-3" />;
        case "ready": return <Package className="w-2.5 h-2.5 sm:w-3 sm:h-3" />;
        case "out_for_delivery": return <Truck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />;
        case "delivered": return <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />;
        case "cancelled": return <XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />;
        default: return null;
      }
    };

    return (
      <span className={cn(
        "inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black tracking-wide shrink-0",
        theme.badgeBg
      )}>
        {status === "pending" ? (
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
        ) : (
          getIcon()
        )}
        <span>{theme.label}</span>
      </span>
    );
  };

  const renderActionButtons = (order: Order, isFullWidth = false) => {
    const isBusy = processingOrder === order.id;

    switch (order.status) {
      case "pending":
        return (
          <div className="flex items-center gap-1 sm:gap-1.5 w-full">
            <button
              onClick={() => handleOrderAction(order.id, "confirm")}
              disabled={isBusy}
              className="flex-1 min-h-[38px] sm:min-h-[42px] px-2 py-1.5 rounded-xl font-black text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all shadow-md active:scale-95 disabled:opacity-50 text-white bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25"
            >
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Accept</span>
            </button>
            <button
              onClick={() => handleOrderAction(order.id, "cancel")}
              disabled={isBusy}
              title="Reject Order"
              className="min-h-[38px] sm:min-h-[42px] w-8 sm:w-9 px-0 rounded-xl font-black text-[11px] sm:text-xs flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );

      case "accepted":
        return (
          <div className={cn("flex items-center gap-2", isFullWidth && "w-full")}>
            <button
              onClick={() => handleOrderAction(order.id, "prepare")}
              disabled={isBusy}
              className="w-full min-h-[38px] sm:min-h-[42px] px-2.5 py-1.5 rounded-xl font-black text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25"
            >
              <ChefHat className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Start Cooking</span>
            </button>
          </div>
        );

      case "preparing":
        return (
          <div className={cn("flex items-center gap-2", isFullWidth && "w-full")}>
            <button
              onClick={() => handleOrderAction(order.id, "ready")}
              disabled={isBusy}
              className="w-full min-h-[38px] sm:min-h-[42px] px-2.5 py-1.5 rounded-xl font-black text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 text-white bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 hover:from-orange-600 hover:to-red-600 shadow-orange-500/25"
            >
              <Package className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Mark Ready</span>
            </button>
          </div>
        );

      case "ready":
        return (
          <div className={cn("flex items-center gap-2", isFullWidth && "w-full")}>
            <button
              onClick={() => handleOrderAction(order.id, "pickup")}
              disabled={isBusy}
              className="w-full min-h-[38px] sm:min-h-[42px] px-2.5 py-1.5 rounded-xl font-black text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 text-white bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-700 hover:to-fuchsia-700 shadow-purple-500/25"
            >
              <Truck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Dispatch</span>
            </button>
          </div>
        );

      case "out_for_delivery":
        return (
          <div className={cn("flex items-center gap-2", isFullWidth && "w-full")}>
            <button
              onClick={() => handleOrderAction(order.id, "deliver")}
              disabled={isBusy}
              className="w-full min-h-[38px] sm:min-h-[42px] px-2.5 py-1.5 rounded-xl font-black text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Delivered</span>
            </button>
          </div>
        );

      case "delivered":
        return (
          <div className="w-full min-h-[38px] sm:min-h-[42px] rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-700 border border-emerald-200/80 font-black text-[11px] sm:text-xs flex items-center justify-center gap-1 px-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Completed</span>
          </div>
        );

      case "cancelled":
        return (
          <div className="w-full min-h-[38px] sm:min-h-[42px] rounded-xl bg-gradient-to-r from-rose-500/10 to-red-500/10 text-rose-700 border border-rose-200/80 font-black text-[11px] sm:text-xs flex items-center justify-center gap-1 px-2">
            <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="truncate">Cancelled</span>
          </div>
        );

      default:
        return null;
    }
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return "";
    }
  };

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

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
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all min-h-[38px]",
                viewMode === "grid"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all min-h-[38px]",
                viewMode === "table"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          <button
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50 min-h-[42px]"
          >
            <RefreshCw className={cn("w-4 h-4 text-slate-500", refreshing && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
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
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4.5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="p-3.5 sm:p-5 bg-gradient-to-b from-slate-50 to-white rounded-2xl sm:rounded-3xl border border-slate-200 animate-pulse space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-200 rounded w-16 sm:w-20" />
                <div className="h-4 bg-slate-200 rounded w-12 sm:w-16" />
              </div>
              <div className="h-3.5 bg-slate-200 rounded w-24 sm:w-28" />
              <div className="h-16 sm:h-20 bg-slate-100 rounded-xl" />
              <div className="h-9 sm:h-11 bg-slate-200 rounded-xl" />
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
      ) : viewMode === "grid" ? (
        /* ======================================================== */
        /* RESTAURANT TICKET GRID VIEW (2x2 on Mobile, 3-4 on Desktop) */
        /* ======================================================== */
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4.5">
          {filteredOrders.map((order) => {
            const theme = getStatusTheme(order.status);
            return (
              <div
                key={order.id}
                className={cn(
                  "rounded-2xl sm:rounded-3xl border shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between overflow-hidden relative backdrop-blur-sm",
                  theme.cardBg,
                  theme.borderColor
                )}
              >
                {/* Top Status Gradient Ribbon */}
                <div className={cn("h-1.5 w-full bg-gradient-to-r", theme.gradientRibbon)} />

                {/* Ambient Decorative Radial Glow */}
                <div className={cn("absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-20 pointer-events-none", theme.glowColor)} />

                <div className="p-3 sm:p-4.5 flex-1 flex flex-col justify-between space-y-2.5 sm:space-y-3.5 relative z-10">
                  <div className="space-y-2.5 sm:space-y-3">
                    {/* Header: Order ID + Status Badge + Time */}
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="font-mono font-black text-slate-900 text-xs sm:text-sm tracking-tight">
                            #{order.id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500 mt-0.5 font-medium">
                          <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span>{getTimeAgo(order.created_at)}</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(order.status)}
                      </div>
                    </div>

                    {/* Customer Row */}
                    <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-200/50">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-700 text-white flex items-center justify-center font-black text-[10px] sm:text-xs shrink-0 shadow-xs ring-1 ring-white">
                          {(order.profiles?.full_name || "G")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs sm:text-sm truncate leading-tight">
                            {order.profiles?.full_name || "Guest Customer"}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {order.delivery_address ? (
                          <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-blue-500/10 text-blue-700 border border-blue-200/60">
                            <Truck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span className="hidden sm:inline">Delivery</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-200/60">
                            <ShoppingBag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span className="hidden sm:inline">Pickup</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Items Breakdown Box (Translucent Glass Effect) */}
                    <div className="p-2 sm:p-2.5 rounded-xl bg-white/80 border border-slate-200/70 shadow-2xs space-y-1">
                      {order.order_items && order.order_items.length > 0 ? (
                        <>
                          {order.order_items.slice(0, 2).map((item, idx) => (
                            <div key={item.id || idx} className="flex items-center justify-between text-[11px] sm:text-xs gap-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-4.5 h-4.5 rounded bg-slate-100 border border-slate-200/90 font-extrabold text-slate-800 text-[10px] flex items-center justify-center shrink-0">
                                  {item.quantity}×
                                </span>
                                <span className="font-semibold text-slate-700 truncate">
                                  {item.menu_items?.name || "Dish Item"}
                                </span>
                              </div>
                              <span className="font-semibold text-slate-500 shrink-0 text-[10px] sm:text-xs">
                                {formatCurrency(item.unit_price * item.quantity)}
                              </span>
                            </div>
                          ))}
                          {order.order_items.length > 2 && (
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="text-[10px] sm:text-[11px] font-bold text-red-600 hover:text-red-700 pt-0.5 block hover:underline text-left truncate"
                            >
                              +{order.order_items.length - 2} more items...
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="text-[11px] sm:text-xs text-slate-500 flex items-center justify-between">
                          <span className="truncate">Meal Package</span>
                          <span className="font-bold text-slate-700">{formatCurrency(order.total_amount)}</span>
                        </div>
                      )}
                    </div>

                    {/* Delivery Address snippet if applicable */}
                    {order.delivery_address && (
                      <div className="flex items-start gap-1 text-[10px] sm:text-xs text-slate-500 px-0.5">
                        <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1 leading-snug">{order.delivery_address}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer: Order Total & Action Buttons */}
                  <div className="pt-2 sm:pt-3 border-t border-slate-200/60 mt-auto space-y-2">
                    <div className="flex items-baseline justify-between px-0.5">
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                      <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="min-h-[38px] sm:min-h-[42px] px-2 sm:px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shrink-0 shadow-2xs"
                        title="View Order Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Details</span>
                      </button>

                      <div className="flex-1 min-w-0">
                        {renderActionButtons(order, true)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ======================================================== */
        /* TABLE VIEW (Available as alternative view mode)          */
        /* ======================================================== */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
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
                        {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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