"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Truck, MapPin, Clock, User, Phone, CheckCircle,
  AlertCircle, Package, Navigation, RefreshCw, Filter,
  Search, Plus, Edit, Trash2, X
} from "lucide-react";
import { createAuthClientBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type DeliveryStatus = 'pending' | 'preparing' | 'ready_for_pickup' | 'assigned' | 'picked_up' | 'on_the_way' | 'arrived' | 'delivered' | 'cancelled' | 'delayed';

interface DeliveryAssignment {
  id: string;
  order_id: string;
  dispatcher_id: string | null;
  status: DeliveryStatus;
  assigned_at: string | null;
  picked_up_at: string | null;
  estimated_delivery_time: string | null;
  actual_delivery_time: string | null;
  delivery_notes: string | null;
  current_location: { lat: number; lng: number; updated_at: string } | null;
  created_at: string;
  orders: {
    id: string;
    total_amount: number;
    delivery_address: string;
    created_at: string;
    user_id: string | null;
  };
  dispatchers: {
    id: string;
    name: string;
    phone: string;
    status: string;
  } | null;
}

interface PickupOrder {
  id: string;
  total_amount: number;
  delivery_address: string;
  created_at: string;
  user_id: string | null;
  status: string;
}

interface Dispatcher {
  id: string;
  name: string;
  phone: string;
  status: string;
  is_active: boolean;
}

const statusColors: Record<DeliveryStatus, string> = {
  pending: 'bg-gray-100 text-gray-800 border-gray-300',
  preparing: 'bg-blue-100 text-blue-800 border-blue-300',
  ready_for_pickup: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  assigned: 'bg-purple-100 text-purple-800 border-purple-300',
  picked_up: 'bg-orange-100 text-orange-800 border-orange-300',
  on_the_way: 'bg-green-100 text-green-800 border-green-300',
  arrived: 'bg-teal-100 text-teal-800 border-teal-300',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
  delayed: 'bg-amber-100 text-amber-800 border-amber-300',
};

const statusLabels: Record<DeliveryStatus, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  assigned: 'Assigned',
  picked_up: 'Picked Up',
  on_the_way: 'On the Way',
  arrived: 'Arrived',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  delayed: 'Delayed',
};

export default function DeliveryDashboard() {
  const [deliveries, setDeliveries] = useState<DeliveryAssignment[]>([]);
  const [pickupOrders, setPickupOrders] = useState<PickupOrder[]>([]);
  const [dispatchers, setDispatchers] = useState<Dispatcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DeliveryStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryAssignment | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [pickupOrderId, setPickupOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    const cleanup = setupRealtimeSubscription();

    return () => {
      cleanup?.();
    };
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/delivery");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      
      console.log("Delivery API data:", data);
      
      setDeliveries(data.deliveries || []);
      setPickupOrders(data.pickupOrders || []);
      setDispatchers(data.dispatchers || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    try {
      const supabase = createAuthClientBrowser();
      const ts = Date.now();

      // Subscribe to delivery_assignments changes
      const deliverySubscription = supabase
        .channel(`delivery_assignments_${ts}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'delivery_assignments'
          },
          () => {
            fetchData();
          }
        )
        .subscribe();

      // Subscribe to dispatchers changes
      const dispatcherSubscription = supabase
        .channel(`dispatchers_${ts}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'dispatchers'
          },
          () => {
            fetchData();
          }
        )
        .subscribe();

      // Subscribe to orders changes (for pickup orders)
      const ordersSubscription = supabase
        .channel(`orders_delivery_${ts}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders'
          },
          () => {
            fetchData();
          }
        )
        .subscribe();

      return () => {
        try {
          supabase.removeChannel(deliverySubscription);
          supabase.removeChannel(dispatcherSubscription);
          supabase.removeChannel(ordersSubscription);
        } catch {}
      };
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
      // Fallback to polling if realtime fails
      const interval = setInterval(() => {
        fetchData();
      }, 5000);
      return () => clearInterval(interval);
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, status: DeliveryStatus, notes?: string) => {
    try {
      const res = await fetch("/api/admin/delivery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryId, status, notes }),
      });
      if (!res.ok) throw new Error("Failed to update");
      await fetchData();
    } catch (error) {
      console.error("Error updating delivery status:", error);
      alert("Failed to update delivery status");
    }
  };

  const assignDispatcher = async (deliveryId: string, dispatcherId: string) => {
    try {
      const res = await fetch("/api/admin/delivery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryId, dispatcherId, status: "assigned" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to assign");
      }
      setShowAssignModal(false);
      await fetchData();
    } catch (error) {
      console.error("Error assigning dispatcher:", error);
      alert("Failed to assign dispatcher");
    }
  };

  const createDeliveryAssignment = async (orderId: string, dispatcherId?: string) => {
    try {
      console.log("Creating delivery assignment for order:", orderId, "dispatcher:", dispatcherId);
      
      if (!orderId) {
        throw new Error("Order ID is required");
      }
      
      if (!dispatcherId) {
        throw new Error("Dispatcher ID is required");
      }
      
      const res = await fetch("/api/admin/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, dispatcherId }),
      });
      
      const data = await res.json();
      console.log("API response:", res.status, data);
      
      if (!res.ok) {
        const errorMsg = data.error || `HTTP ${res.status}: Failed to create delivery assignment`;
        throw new Error(errorMsg);
      }
      
      await fetchData();
      setShowAssignModal(false);
      setPickupOrderId(null);
    } catch (error: any) {
      console.error("Error creating delivery assignment:", error);
      const errorMsg = error.message || "Unknown error";
      alert(`Failed to create delivery assignment: ${errorMsg}`);
    }
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesFilter = filter === 'all' || delivery.status === filter;
    const matchesSearch = 
      delivery.orders?.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.orders?.delivery_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.dispatchers?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const readyForPickup = [
    ...deliveries.filter(d => d.status === 'ready_for_pickup'),
    ...pickupOrders.filter(o => o.status === 'ready' || o.status === 'preparing')
  ];

  const pendingCount = [
    ...deliveries.filter(d => d.status === 'pending' || d.status === 'preparing'),
    ...pickupOrders.filter(o => o.status === 'pending')
  ].length;

  const readyCount = readyForPickup.length;

  const inTransitCount = deliveries.filter(d => 
    d.status === 'on_the_way' || d.status === 'picked_up'
  ).length;

  const availableDispatchers = dispatchers.filter(d => d.status === 'available' && d.is_active);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading delivery dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Delivery Fleet</h1>
          <p className="text-sm text-slate-600 mt-1">Track driver routes, dispatch assignments, and live orders.</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-semibold text-sm shadow-sm active:scale-95 min-h-[44px]"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

        {/* Stats Cards - Strict 2x2 on Mobile, 4 Columns on Desktop with Full-Bleed Gradients */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4.5 mb-6 sm:mb-8">
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white shadow-lg shadow-amber-950/20 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-amber-100">Queue</span>
            </div>
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-100/80 mb-0.5">Pending Prep</p>
            <p className="text-xl sm:text-3xl font-black text-white tracking-tight">{pendingCount}</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-purple-800 text-white shadow-lg shadow-purple-950/20 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-purple-100">Ready</span>
            </div>
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-purple-100/80 mb-0.5">Pickup Ready</p>
            <p className="text-xl sm:text-3xl font-black text-white tracking-tight">{readyCount}</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-cyan-600 via-teal-600 to-blue-700 text-white shadow-lg shadow-cyan-950/20 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-cyan-100">Active</span>
            </div>
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-cyan-100/80 mb-0.5">In Transit</p>
            <p className="text-xl sm:text-3xl font-black text-white tracking-tight">{inTransitCount}</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white shadow-lg shadow-emerald-950/20 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-emerald-100">Delivered</span>
            </div>
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-100/80 mb-0.5">Completed Today</p>
            <p className="text-xl sm:text-3xl font-black text-white tracking-tight">
              {deliveries.filter(d => d.status === 'delivered').length +
               pickupOrders.filter(o => o.status === 'delivered').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search order ID, delivery address, driver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-red-500 focus:bg-white transition-all"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {(['all', 'pending', 'ready_for_pickup', 'on_the_way', 'delivered'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all min-h-[38px] ${
                    filter === tab
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tab === 'ready_for_pickup' ? 'Ready' : tab === 'on_the_way' ? 'In Transit' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Delivery Cards Grid: Strict 2x2 on Mobile, 2-3 Columns on Desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4.5">
          {filteredDeliveries.map((delivery) => {
            const isDelivered = delivery.status === 'delivered';
            const isTransit = delivery.status === 'on_the_way' || delivery.status === 'picked_up';
            const isReady = delivery.status === 'ready_for_pickup';

            return (
              <motion.div
                key={delivery.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "rounded-2xl sm:rounded-3xl p-3 sm:p-5 border transition-all flex flex-col justify-between shadow-sm relative overflow-hidden",
                  isTransit
                    ? "bg-gradient-to-br from-cyan-600 via-teal-600 to-blue-700 text-white border-cyan-400/30"
                    : isReady
                      ? "bg-gradient-to-br from-purple-600 via-fuchsia-600 to-purple-800 text-white border-purple-400/30"
                      : isDelivered
                        ? "bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white border-emerald-400/30"
                        : "bg-white text-slate-900 border-slate-200/90"
                )}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className={cn(
                      "font-black text-xs sm:text-sm truncate",
                      isTransit || isReady || isDelivered ? "text-white" : "text-slate-900"
                    )}>
                      #{delivery.orders.id.slice(0, 6).toUpperCase()}
                    </span>
                    <span className={cn(
                      "text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0",
                      isTransit || isReady || isDelivered
                        ? "bg-black/25 text-white backdrop-blur-md border border-white/20"
                        : statusColors[delivery.status]
                    )}>
                      {statusLabels[delivery.status]}
                    </span>
                  </div>

                  {/* Address & Price */}
                  <div className={cn(
                    "p-2 sm:p-2.5 rounded-xl mb-2",
                    isTransit || isReady || isDelivered
                      ? "bg-black/20 backdrop-blur-md border border-white/20 text-white"
                      : "bg-slate-50 border border-slate-100 text-slate-700"
                  )}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold opacity-80">Total Amount</span>
                      <span className="font-black text-xs sm:text-sm">${delivery.orders.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-start gap-1 text-[11px] font-medium leading-tight line-clamp-2">
                      <MapPin className="w-3 h-3 shrink-0 mt-0.5 opacity-70" />
                      <span>{delivery.orders.delivery_address}</span>
                    </div>
                  </div>

                  {/* Dispatcher Info */}
                  {delivery.dispatchers ? (
                    <div className={cn(
                      "flex items-center gap-2 p-2 rounded-xl mb-2.5",
                      isTransit || isReady || isDelivered
                        ? "bg-white/10 backdrop-blur-md text-white"
                        : "bg-slate-50 text-slate-800 border border-slate-100"
                    )}>
                      <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs truncate">{delivery.dispatchers.name}</p>
                        <a 
                          href={`tel:${delivery.dispatchers.phone}`} 
                          className="text-[10px] font-medium opacity-80 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-2.5 h-2.5" />
                          <span>{delivery.dispatchers.phone}</span>
                        </a>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-white/20">
                  {!delivery.dispatchers && delivery.status === 'ready_for_pickup' && (
                    <button
                      onClick={() => {
                        setSelectedDelivery(delivery);
                        setShowAssignModal(true);
                      }}
                      className="w-full min-h-[38px] flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 rounded-xl font-black text-xs shadow-md active:scale-95 transition-all"
                    >
                      <User className="w-3.5 h-3.5" />
                      Assign Driver
                    </button>
                  )}

                  {delivery.status === 'assigned' && (
                    <button
                      onClick={() => updateDeliveryStatus(delivery.id, 'picked_up')}
                      className="w-full min-h-[38px] flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 rounded-xl font-black text-xs shadow-md active:scale-95 transition-all"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Mark Picked Up
                    </button>
                  )}

                  {delivery.status === 'picked_up' && (
                    <button
                      onClick={() => updateDeliveryStatus(delivery.id, 'on_the_way')}
                      className="w-full min-h-[38px] flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 rounded-xl font-black text-xs shadow-md active:scale-95 transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Mark On Way
                    </button>
                  )}

                  {delivery.status === 'on_the_way' && (
                    <button
                      onClick={() => updateDeliveryStatus(delivery.id, 'arrived')}
                      className="w-full min-h-[38px] flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 rounded-xl font-black text-xs shadow-md active:scale-95 transition-all"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Mark Arrived
                    </button>
                  )}

                  {delivery.status === 'arrived' && (
                    <button
                      onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}
                      className="w-full min-h-[38px] flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 rounded-xl font-black text-xs shadow-md active:scale-95 transition-all"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Mark Delivered
                    </button>
                  )}

                  {delivery.status === 'preparing' && (
                    <button
                      onClick={() => updateDeliveryStatus(delivery.id, 'ready_for_pickup')}
                      className="w-full min-h-[38px] flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 rounded-xl font-black text-xs shadow-md active:scale-95 transition-all"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Mark Ready
                    </button>
                  )}

                  {isDelivered && (
                    <div className="w-full py-1.5 text-center text-[11px] font-bold opacity-80">
                      Delivered Successfully
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {filteredDeliveries.length === 0 && (
            <div className="col-span-2 lg:col-span-3 bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">No deliveries found</h3>
              <p className="text-xs text-slate-500">
                {filter === 'all' && searchQuery === '' 
                  ? 'No active deliveries currently in the fleet pipeline' 
                  : 'No fleet dispatches match your selected filter'}
              </p>
            </div>
          )}
        </div>

        {/* Pickup Orders Section */}
        {pickupOrders.filter(o => o.status === 'ready' || o.status === 'preparing').length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Orders Ready for Pickup</h2>
            <div className="space-y-4">
              {pickupOrders.filter(o => o.status === 'ready' || o.status === 'preparing').map((order) => (
                <div key={order.id} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900">Order #{order.id.slice(0, 8)}</h3>
                        <span className="px-3 py-1 rounded-full text-sm font-medium border bg-yellow-100 text-yellow-800 border-yellow-300">
                          Ready for Pickup
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(order.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{order.delivery_address}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">${order.total_amount.toFixed(2)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPickupOrderId(order.id);
                      setSelectedDelivery(null);
                      setShowAssignModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Delivery Assignment
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assign Dispatcher Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {selectedDelivery ? 'Assign Dispatcher' : 'Create Delivery Assignment'}
              </h3>
              <div className="space-y-3 mb-6">
                {availableDispatchers.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">No available dispatchers</p>
                ) : (
                  availableDispatchers.map((dispatcher) => (
                    <button
                      key={dispatcher.id}
                      onClick={() => {
                        if (selectedDelivery) {
                          assignDispatcher(selectedDelivery.id, dispatcher.id);
                        } else if (pickupOrderId) {
                          createDeliveryAssignment(pickupOrderId, dispatcher.id);
                        }
                      }}
                      className="w-full flex items-center gap-4 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">{dispatcher.name}</p>
                        <p className="text-sm text-gray-600">{dispatcher.phone}</p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        Available
                      </span>
                    </button>
                  ))
                )}
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Hidden state for pickup order being created */}
        {pickupOrderId && null}
      </div>
  );
}

