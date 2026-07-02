"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Clock, Truck, CheckCircle, AlertCircle,
  Phone, User, Package, Navigation, Timer
} from "lucide-react";
import Link from "next/link";
import { createAuthClientBrowser } from "@/lib/supabase/client";

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
  route_info: { distance: number; duration: number } | null;
  dispatchers: {
    id: string;
    name: string;
    phone: string;
    avatar_url: string | null;
  } | null;
}

interface Order {
  id: string;
  total_amount: number;
  delivery_address: string;
  status: string;
  created_at: string;
  customer_location?: { lat: number; lng: number; address: string } | null;
  customer_confirmed?: boolean;
  dispatcher_confirmed?: boolean;
  delivery_completion_status?: string;
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    menu_items: {
      name: string;
      image_url: string;
    };
  }>;
}

const statusSteps: { status: DeliveryStatus; label: string; icon: any }[] = [
  { status: 'pending', label: 'Order Placed', icon: Package },
  { status: 'preparing', label: 'Preparing', icon: Timer },
  { status: 'ready_for_pickup', label: 'Ready for Pickup', icon: CheckCircle },
  { status: 'assigned', label: 'Dispatcher Assigned', icon: User },
  { status: 'picked_up', label: 'Picked Up', icon: Truck },
  { status: 'on_the_way', label: 'On the Way', icon: Navigation },
  { status: 'arrived', label: 'Arrived', icon: MapPin },
  { status: 'delivered', label: 'Delivered', icon: CheckCircle },
];

const statusColors: Record<DeliveryStatus, string> = {
  pending: 'bg-gray-500',
  preparing: 'bg-blue-500',
  ready_for_pickup: 'bg-yellow-500',
  assigned: 'bg-purple-500',
  picked_up: 'bg-orange-500',
  on_the_way: 'bg-green-500',
  arrived: 'bg-teal-500',
  delivered: 'bg-emerald-500',
  cancelled: 'bg-red-500',
  delayed: 'bg-amber-500',
};

export default function OrderTrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const [orderId, setOrderId] = useState<string>("");
  const [order, setOrder] = useState<Order | null>(null);
  const [delivery, setDelivery] = useState<DeliveryAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { orderId: id } = await params;
      setOrderId(id);
      await fetchOrderData(id);
      setupRealtimeSubscription(id);
    };

    init();
  }, [params]);

  const fetchOrderData = async (id: string) => {
    try {
      const res = await fetch(`/api/track?order_id=${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      setOrder(data.order);
      setDelivery(data.delivery);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = (id: string) => {
    const supabase = createAuthClientBrowser();
    
    const subscription = supabase
      .channel(`delivery-tracking-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_assignments',
          filter: `order_id=eq.${id}`
        },
        (payload: any) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setDelivery(payload.new as DeliveryAssignment);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const getCurrentStepIndex = () => {
    if (!delivery) return 0;
    return statusSteps.findIndex(step => step.status === delivery.status);
  };

  const getEstimatedTime = () => {
    if (!delivery?.estimated_delivery_time) return null;
    const eta = new Date(delivery.estimated_delivery_time);
    const now = new Date();
    const diff = eta.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    return minutes > 0 ? `${minutes} min` : 'Arriving soon';
  };

  const confirmDelivery = async (status: 'completed' | 'disputed') => {
    try {
      const res = await fetch('/api/delivery/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          deliveryId: delivery?.id, 
          status,
          confirmer: 'customer'
        }),
      });

      if (!res.ok) throw new Error('Failed to confirm delivery');

      // Refresh data
      await fetchOrderData(orderId);
    } catch (error) {
      console.error('Error confirming delivery:', error);
      alert('Failed to confirm delivery');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "We couldn't find your order."}</p>
          <Link href="/" className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = getCurrentStepIndex();
  const estimatedTime = getEstimatedTime();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
              <p className="text-gray-600">Order #{orderId.slice(0, 8)}</p>
            </div>
            {estimatedTime && (
              <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-700">ETA: {estimatedTime}</span>
              </div>
            )}
          </div>

          {/* Status Timeline */}
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index <= currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <div key={step.status} className="relative flex items-center gap-4 mb-6 last:mb-0">
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted ? statusColors[delivery?.status || 'pending'] : 'bg-gray-200'
                  }`}>
                    <Icon className={`w-4 h-4 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isCurrent ? 'text-red-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {isCurrent && delivery && (
                      <p className="text-sm text-gray-500">
                        {delivery.status === 'on_the_way' && delivery.current_location && 'Live tracking active'}
                        {delivery.status === 'delivered' && delivery.actual_delivery_time && `Delivered at ${new Date(delivery.actual_delivery_time).toLocaleTimeString()}`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dispatcher Info */}
        {delivery?.dispatchers && delivery.status !== 'pending' && delivery.status !== 'preparing' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your Dispatcher</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {delivery.dispatchers.avatar_url ? (
                  <img src={delivery.dispatchers.avatar_url} alt={delivery.dispatchers.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{delivery.dispatchers.name}</p>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${delivery.dispatchers.phone}`} className="hover:text-red-600">
                    {delivery.dispatchers.phone}
                  </a>
                </div>
              </div>
              {delivery.status === 'on_the_way' && (
                <a
                  href={`tel:${delivery.dispatchers.phone}`}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </a>
              )}
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Details</h2>
          <div className="space-y-3 mb-4">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                    {item.menu_items.image_url ? (
                      <img src={item.menu_items.image_url} alt={item.menu_items.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.menu_items.name}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="font-semibold text-gray-900">
                  ${(item.unit_price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Delivery Address</h2>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-gray-700">{order.delivery_address}</p>
          </div>
        </div>

        {/* Delivery Confirmation */}
        {delivery?.status === 'arrived' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mt-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Confirm Delivery</h2>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Delivery Status</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  order.delivery_completion_status === 'completed' ? 'bg-green-100 text-green-800' :
                  order.delivery_completion_status === 'disputed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.delivery_completion_status || 'Pending'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className={order.customer_confirmed ? 'text-green-600' : 'text-gray-500'}>
                    You: {order.customer_confirmed ? 'Confirmed' : 'Waiting'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <span className={order.dispatcher_confirmed ? 'text-green-600' : 'text-gray-500'}>
                    Dispatcher: {order.dispatcher_confirmed ? 'Confirmed' : 'Waiting'}
                  </span>
                </div>
              </div>
            </div>
            
            {!order.customer_confirmed && (
              <div className="flex gap-3">
                <button
                  onClick={() => confirmDelivery('completed')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  Confirm Received
                </button>
                <button
                  onClick={() => confirmDelivery('disputed')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <AlertCircle className="w-5 h-5" />
                  Report Issue
                </button>
              </div>
            )}
            
            {order.customer_confirmed && !order.dispatcher_confirmed && (
              <div className="text-center text-gray-600">
                <p className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  Waiting for dispatcher confirmation...
                </p>
              </div>
            )}
            
            {order.customer_confirmed && order.dispatcher_confirmed && (
              <div className="text-center text-green-600">
                <p className="flex items-center justify-center gap-2 font-medium">
                  <CheckCircle className="w-5 h-5" />
                  Delivery confirmed by both parties
                </p>
              </div>
            )}
          </div>
        )}

        {/* Delivery Notes */}
        {delivery?.delivery_notes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-800">Delivery Note</p>
                <p className="text-yellow-700">{delivery.delivery_notes}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
