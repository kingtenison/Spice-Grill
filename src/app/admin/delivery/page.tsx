"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Truck, MapPin, Clock, User, Phone, CheckCircle,
  AlertCircle, Package, Navigation, RefreshCw, Filter,
  Search, Plus, Edit, Trash2, X
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

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
    setupRealtimeSubscription();

    return () => {
      // Cleanup will be handled in setupRealtimeSubscription
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
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Subscribe to delivery_assignments changes
      const deliverySubscription = supabase
        .channel('delivery_assignments_changes')
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
        .channel('dispatchers_changes')
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
        .channel('orders_changes')
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
        deliverySubscription.unsubscribe();
        dispatcherSubscription.unsubscribe();
        ordersSubscription.unsubscribe();
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Delivery Dashboard</h1>
            <p className="text-gray-600">Track and manage all deliveries in real-time</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{readyCount}</p>
                <p className="text-sm text-gray-600">Ready for Pickup</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Truck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{inTransitCount}</p>
                <p className="text-sm text-gray-600">In Transit</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {deliveries.filter(d => d.status === 'delivered').length +
                   pickupOrders.filter(o => o.status === 'delivered').length}
                </p>
                <p className="text-sm text-gray-600">Delivered Today</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID, address, or dispatcher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'all' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'pending' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('ready_for_pickup')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'ready_for_pickup' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Ready
              </button>
              <button
                onClick={() => setFilter('on_the_way')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'on_the_way' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                In Transit
              </button>
              <button
                onClick={() => setFilter('delivered')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'delivered' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Delivered
              </button>
            </div>
          </div>
        </div>

        {/* Delivery List */}
        <div className="space-y-4">
          {filteredDeliveries.map((delivery) => (
            <motion.div
              key={delivery.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-gray-900">Order #{delivery.orders.id.slice(0, 8)}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[delivery.status]}`}>
                      {statusLabels[delivery.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(delivery.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{delivery.orders.delivery_address}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">${delivery.orders.total_amount.toFixed(2)}</p>
                </div>
              </div>

              {delivery.dispatchers && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                  <User className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{delivery.dispatchers.name}</p>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${delivery.dispatchers.phone}`} className="hover:text-red-600">
                        {delivery.dispatchers.phone}
                      </a>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    delivery.dispatchers.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {delivery.dispatchers.status}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {!delivery.dispatchers && delivery.status === 'ready_for_pickup' && (
                  <button
                    onClick={() => {
                      setSelectedDelivery(delivery);
                      setShowAssignModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Assign Dispatcher
                  </button>
                )}

                {delivery.status === 'assigned' && (
                  <button
                    onClick={() => updateDeliveryStatus(delivery.id, 'picked_up')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Truck className="w-4 h-4" />
                    Mark Picked Up
                  </button>
                )}

                {delivery.status === 'picked_up' && (
                  <button
                    onClick={() => updateDeliveryStatus(delivery.id, 'on_the_way')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    Mark On the Way
                  </button>
                )}

                {delivery.status === 'on_the_way' && (
                  <button
                    onClick={() => updateDeliveryStatus(delivery.id, 'arrived')}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    Mark Arrived
                  </button>
                )}

                {delivery.status === 'arrived' && (
                  <button
                    onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Delivered
                  </button>
                )}

                {delivery.status === 'preparing' && (
                  <button
                    onClick={() => updateDeliveryStatus(delivery.id, 'ready_for_pickup')}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Ready
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          {filteredDeliveries.length === 0 && (
            <div className="bg-white rounded-xl p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
              <p className="text-gray-600">
                {filter === 'all' && searchQuery === '' 
                  ? 'No active deliveries at the moment' 
                  : 'No deliveries match your filters'}
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
    </div>
  );
}
