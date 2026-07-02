"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  X,
  Eye,
  RefreshCw,
  MapPin,
  CreditCard,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  AlertCircle,
  Ban,
  User as UserIcon,
  Settings,
  Heart,
  Star
} from "lucide-react";
import { createClient, safeGetUser } from "@/lib/supabase/client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getMenuItemImage } from "@/lib/utils";

interface OrderItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  menu_items?: {
    name: string;
    image_url?: string;
  };
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  shipping_method?: string;
  payment_method?: string;
  special_instructions?: string;
  order_items: OrderItem[];
  shipping_address?: any;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  avatar_url?: string;
  created_at: string;
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Order Placed' },
  accepted: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Order Accepted' },
  preparing: { icon: RefreshCw, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Preparing' },
  ready: { icon: Package, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Ready for Pickup' },
  out_for_delivery: { icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-100', label: 'Out for Delivery' },
  delivered: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Delivered' },
  cancelled: { icon: X, color: 'text-red-600', bg: 'bg-red-100', label: 'Cancelled' }
};

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'loyalty'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [subscriptionActive, setSubscriptionActive] = useState(false);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    setCancellingOrder(orderId);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setOrders(orders.map(order =>
        order.id === orderId
          ? { ...order, status: 'cancelled' as Order['status'] }
          : order
      ));

      toast.success('Order cancelled successfully');
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order. Please try again.');
    } finally {
      setCancellingOrder(null);
    }
  };

  const canCancelOrder = (order: Order) => {
    return order.status === 'pending' && !cancellingOrder;
  };

  const getOrderTimeline = (order: Order) => {
    const timeline = [
      { status: 'pending', label: 'Order Placed', time: order.created_at, completed: true },
      { status: 'confirmed', label: 'Order Confirmed', time: null, completed: ['confirmed', 'preparing', 'ready', 'delivered'].includes(order.status) },
      { status: 'preparing', label: 'Being Prepared', time: null, completed: ['preparing', 'ready', 'delivered'].includes(order.status) },
      { status: 'ready', label: 'Ready for Pickup/Delivery', time: null, completed: ['ready', 'delivered'].includes(order.status) },
      { status: 'delivered', label: 'Delivered', time: null, completed: order.status === 'delivered' },
    ];

    if (order.status === 'cancelled') {
      timeline.push({ status: 'cancelled', label: 'Order Cancelled', time: null, completed: true });
    }

    return timeline;
  };

  useEffect(() => {
    let channel: any = null;
    let active = true;

    const loadUserData = async () => {
      try {
        // Fetch user and profile from server
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) {
          console.error("Auth check failed with status:", authRes.status);
          if (active) {
            window.location.href = '/login';
          }
          return;
        }

        const authData = await authRes.json();
        
        if (!active) return;

        if (!authData.user) {
          window.location.href = '/login';
          return;
        }

        setUser(authData.user);
        
        if (authData.profile) {
          setProfile({
            ...authData.profile,
            email: authData.user.email || ''
          });
        }

        // Fetch user orders from server
        const ordersRes = await fetch("/api/orders/user");
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (active) {
            setOrders(ordersData.orders || []);
          }
        } else {
          console.error("Failed to load orders");
        }

        // Set up real-time subscription for order updates (only once)
        if (!subscriptionActive) {
          setSubscriptionActive(true);

          try {
            const supabase = createClient();
            channel = supabase.channel(`user-orders-${authData.user.id}`);
            channel
              .on(
                'postgres_changes',
                {
                  event: 'UPDATE',
                  schema: 'public',
                  table: 'orders',
                  filter: `user_id=eq.${authData.user.id}`
                },
                (payload: any) => {
                  console.log('Order updated:', payload);
                  setOrders(currentOrders =>
                    currentOrders.map(order =>
                      order.id === payload.new.id
                        ? { ...order, ...payload.new }
                        : order
                    )
                  );
                }
              )
              .subscribe((status: string) => {
                console.log('Subscription status:', status);
              });
          } catch (error) {
            console.warn('Failed to set up realtime subscription:', error);
          }
        }
      } catch (err: any) {
        console.error('Failed to load user data:', err);
        if (active) {
          window.location.href = '/login?error=session_expired';
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadUserData();

    return () => {
      active = false;
      try {
        setSubscriptionActive(false);
        if (channel) {
          channel.unsubscribe();
        }
      } catch (error) {
        console.warn('Error unsubscribing from realtime channel:', error);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container px-4 pt-24 pb-12 mx-auto max-w-6xl">
          <div className="flex justify-center items-center py-20">
            <div className="animate-pulse w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="container px-4 pt-24 pb-12 mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Account</h1>
            <p className="text-gray-600">Manage your orders and account information</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white p-1 rounded-2xl border border-gray-200 shadow-sm w-fit">
          {[
            { id: 'orders', label: 'My Orders', icon: Package },
            { id: 'profile', label: 'Profile', icon: UserIcon },
            { id: 'loyalty', label: 'Rewards', icon: Star }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-2 text-gray-900">No orders yet</h3>
                <p className="text-gray-600 mb-6">Your order history will appear here</p>
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                >
                  Start Your First Order
                </Link>
              </div>
            ) : (
              orders.map((order) => {
                const statusInfo = statusConfig[order.status];
                const StatusIcon = statusInfo.icon;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                  >
                    {/* Order Header */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full ${statusInfo.bg} flex items-center justify-center`}>
                            <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              Order #{order.id.slice(-8).toUpperCase()}
                            </h3>
                            <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">${order.total_amount.toFixed(2)}</p>
                          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            {statusInfo.label}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          <span>{order.order_items?.length || 0} items</span>
                        </div>

                        {order.shipping_method && (
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            <span>{order.shipping_method}</span>
                          </div>
                        )}

                        {order.payment_method && (
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            <span className="capitalize">{order.payment_method.replace('_', ' ')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Tracking Timeline */}
                    <div className="p-6 border-b border-gray-200">
                      <h5 className="font-semibold text-gray-900 mb-4">Order Progress</h5>
                      <div className="space-y-3">
                        {getOrderTimeline(order).map((step, index) => {
                          const Icon = statusConfig[step.status as keyof typeof statusConfig]?.icon || Clock;
                          const isCompleted = step.completed;
                          const isCurrent = order.status === step.status;

                          return (
                            <div key={step.status} className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isCompleted ? 'bg-green-100 text-green-600' :
                                isCurrent ? 'bg-blue-100 text-blue-600' :
                                'bg-gray-100 text-gray-400'
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${
                                  isCompleted ? 'text-green-800' :
                                  isCurrent ? 'text-blue-800' :
                                  'text-gray-600'
                                }`}>
                                  {step.label}
                                </p>
                                {step.time && (
                                  <p className="text-xs text-gray-500">
                                    {new Date(step.time).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">Items Ordered</h4>
                        <button
                          onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                          className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          {selectedOrder?.id === order.id ? 'Hide Details' : 'View Details'}
                        </button>
                      </div>

                      {/* Preview Items */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        {order.order_items && order.order_items.length > 0 ? (
                          <>
                            {order.order_items.slice(0, 3).map((item) => (
                              <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                               {item.menu_items ? (
                                 <img
                                   src={getMenuItemImage(item.menu_items)}
                                   alt={item.menu_items.name}
                                   className="w-full h-full object-cover rounded-lg"
                                 />
                               ) : (
                                <Package className="w-6 h-6 text-gray-400" />
                              )}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 text-sm">{item.menu_items?.name || 'Menu Item'}</p>
                                  <p className="text-xs text-gray-600">Qty: {item.quantity} × ${item.unit_price.toFixed(2)}</p>
                                </div>
                              </div>
                            ))}

                            {order.order_items.length > 3 && (
                              <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600">
                                  +{(order.order_items.length - 3)} more items
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="col-span-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              <strong>Note:</strong> Order items details are being loaded. The order was placed successfully for <strong>${order.total_amount.toFixed(2)}</strong>.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Cancellation Button */}
                      {canCancelOrder(order) && (
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-5 h-5 text-yellow-600" />
                              <span className="text-sm font-medium text-yellow-800">
                                Need to cancel this order?
                              </span>
                            </div>
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={cancellingOrder === order.id}
                              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                              {cancellingOrder === order.id ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  Cancelling...
                                </>
                              ) : (
                                <>
                                  <Ban className="w-4 h-4" />
                                  Cancel Order
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {selectedOrder?.id === order.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-gray-200 pt-4"
                          >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Full Item List */}
                              <div>
                                <h5 className="font-semibold text-gray-900 mb-3">All Items</h5>
                                <div className="space-y-3">
                                  {order.order_items && order.order_items.length > 0 ? (
                                    order.order_items.map((item) => (
                                      <div key={item.id} className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
                                           {item.menu_items ? (
                                             <img
                                               src={getMenuItemImage(item.menu_items)}
                                               alt={item.menu_items.name}
                                               className="w-full h-full object-cover rounded"
                                             />
                                           ) : (
                                            <Package className="w-4 h-4 text-gray-400" />
                                          )}
                                          </div>
                                          <div>
                                            <p className="font-medium text-gray-900">{item.menu_items?.name || 'Menu Item'}</p>
                                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                          </div>
                                        </div>
                                        <span className="font-semibold text-gray-900">
                                          ${(item.unit_price * item.quantity).toFixed(2)}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                      <p className="text-sm text-gray-600">
                                        Order items details are not available. The order total is <strong>${order.total_amount.toFixed(2)}</strong>.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Order Details */}
                              <div>
                                <h5 className="font-semibold text-gray-900 mb-3">Order Details</h5>
                                <div className="space-y-3">
                                  {order.shipping_address && (
                                    <div className="flex items-start gap-3">
                                      <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
                                      <div>
                                        <p className="font-medium text-gray-900">Delivery Address</p>
                                        <p className="text-sm text-gray-600">
                                          {typeof order.shipping_address === 'string'
                                            ? order.shipping_address
                                            : `${order.shipping_address.street}, ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zip_code}`
                                          }
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {order.special_instructions && (
                                    <div className="flex items-start gap-3">
                                      <Package className="w-4 h-4 text-gray-600 mt-0.5" />
                                      <div>
                                        <p className="font-medium text-gray-900">Special Instructions</p>
                                        <p className="text-sm text-gray-600">{order.special_instructions}</p>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-gray-600" />
                                    <div>
                                      <p className="font-medium text-gray-900">Order Date</p>
                                      <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleString()}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <DollarSign className="w-4 h-4 text-gray-600" />
                                    <div>
                                      <p className="font-medium text-gray-900">Payment Status</p>
                                      <p className={`text-sm font-medium ${
                                        order.payment_status === 'paid' ? 'text-green-600' :
                                        order.payment_status === 'failed' ? 'text-red-600' :
                                        'text-yellow-600'
                                      }`}>
                                        {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && profile && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <UserIcon className="w-10 h-10 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{profile.full_name}</h2>
                <p className="text-gray-600 mb-1">{profile.email}</p>
                {profile.phone && <p className="text-gray-600">{profile.phone}</p>}
                <p className="text-sm text-gray-500 mt-2">
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{profile.full_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{profile.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{profile.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg capitalize">{profile.role}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/menu"
                    className="flex items-center gap-3 w-full p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Package className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-900">Place New Order</p>
                      <p className="text-sm text-red-700">Browse our menu and order</p>
                    </div>
                  </Link>

                  <Link
                    href="/loyalty"
                    className="flex items-center gap-3 w-full p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Star className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">View Rewards</p>
                      <p className="text-sm text-blue-700">Check your loyalty points</p>
                    </div>
                  </Link>

                   <Link
                     href="/contact"
                     className="flex items-center gap-3 w-full p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                   >
                     <Phone className="w-5 h-5 text-green-600" />
                     <div>
                       <p className="font-medium text-green-900">Contact Support</p>
                       <p className="text-sm text-green-700">Get help with your orders</p>
                     </div>
                   </Link>
                 </div>
               </div>
             </div>
           </div>
         )}

         {/* Loyalty Tab - Live Summary */}
         {activeTab === 'loyalty' && (
           <LoyaltySummary />
         )}
       </main>
     </div>
   );
 }

// Live Loyalty Summary Component (used in account page)
function LoyaltySummary() {
  const [data, setData] = useState<{ points: number; tier: string; pointsToNext: number; nextTier: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/loyalty");
        if (res.ok) {
          const json = await res.json();
          setData({
            points: json.points,
            tier: json.tier,
            pointsToNext: json.pointsToNext,
            nextTier: json.nextTier,
          });
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">Loading rewards...</div>;
  }

  const points = data?.points ?? 0;
  const tier = data?.tier ?? "Bronze";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-8 h-8 text-yellow-500" />
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Rewards Program</h3>
              <p className="text-sm text-gray-600">{tier} Member</p>
            </div>
          </div>
        </div>
        <Link href="/loyalty" className="text-sm font-bold text-red-600 hover:text-red-700">View all rewards →</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-gray-50 rounded-2xl p-6 text-center">
          <div className="text-4xl font-black text-red-600">{points}</div>
          <div className="text-sm font-bold text-gray-600 mt-1">Points Balance</div>
        </div>
        <div className="bg-gray-50 rounded-2xl p-6 text-center">
          <div className="text-2xl font-black text-gray-900">{tier}</div>
          <div className="text-sm font-bold text-gray-600 mt-1">Current Tier</div>
        </div>
        <div className="bg-gray-50 rounded-2xl p-6 text-center">
          <div className="text-2xl font-black text-gray-900">{data?.pointsToNext ?? 0}</div>
          <div className="text-sm font-bold text-gray-600 mt-1">Points to {data?.nextTier}</div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href="/loyalty"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-yellow-500 hover:bg-yellow-600 text-white font-bold transition-colors shadow-lg shadow-yellow-500/20"
        >
          <Star className="w-5 h-5" /> Redeem Rewards
        </Link>
      </div>
    </div>
  );
}