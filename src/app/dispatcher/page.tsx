"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Truck, MapPin, Phone, User, CheckCircle, Navigation,
  Clock, AlertCircle, LogOut, RefreshCw
} from "lucide-react";
import dynamic from "next/dynamic";
const LiveMap = dynamic(() => import("@/components/dispatcher/LiveMap"), { ssr: false });

const storageGet = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const storageSet = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch {} };
const storageRemove = (key: string) => { try { localStorage.removeItem(key); } catch {} };

type DeliveryStatus = 'pending' | 'preparing' | 'ready_for_pickup' | 'assigned' | 'picked_up' | 'on_the_way' | 'arrived' | 'delivered' | 'cancelled' | 'delayed';

interface DeliveryAssignment {
  id: string;
  order_id: string;
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
    customer_location?: { lat: number; lng: number; address: string } | null;
    customer_confirmed?: boolean;
    dispatcher_confirmed?: boolean;
    delivery_completion_status?: string;
  };
}

interface AvailableOrder {
  id: string;
  order_id: string;
  status: DeliveryStatus;
  created_at: string;
  orders: {
    id: string;
    total_amount: number;
    delivery_address: string;
    created_at: string;
  };
}

interface DispatcherProfile {
  id: string;
  name: string;
  phone: string;
  status: string;
  is_active: boolean;
  application_status: 'pending' | 'approved' | 'rejected';
  application_notes: string | null;
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

export default function DispatcherPortal() {
  const [dispatcherProfile, setDispatcherProfile] = useState<DispatcherProfile | null>(null);
  const [activeDeliveries, setActiveDeliveries] = useState<DeliveryAssignment[]>([]);
  const [completedDeliveries, setCompletedDeliveries] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const initDispatcherPortal = async () => {
      // 0. Check main site auth session first
      try {
        const authRes = await fetch('/api/auth/me');
        if (!authRes.ok || !(await authRes.json()).user) {
          window.location.href = '/login';
          return;
        }
      } catch {
        window.location.href = '/login';
        return;
      }

      try {
        // 1. Try to auto-login based on the main auth session
        const res = await fetch('/api/dispatcher');
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            if (data.profile.application_status === 'approved') {
              storageSet('dispatcher_id', data.profile.id);
              setDispatcherProfile(data.profile);
              setActiveDeliveries(data.active || []);
              setCompletedDeliveries(data.completed || []);
              startPolling(data.profile.id);
              setLoading(false);
              return;
            } else if (data.profile.application_status === 'pending') {
              setError('Your application is still pending review. Please wait for admin approval.');
              setLoading(false);
              return;
            } else if (data.profile.application_status === 'rejected') {
              setError(`Your application was rejected. ${data.profile.application_notes || 'Please contact support for more information.'}`);
              setLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Auto-login check failed:', err);
      }

      // 2. Fallback to localStorage dispatcher_id if user is not logged in on the main site
      const savedDispatcherId = storageGet('dispatcher_id');
      if (savedDispatcherId) {
        await fetchDispatcherProfile(savedDispatcherId);
      } else {
        setLoading(false);
      }
    };

    initDispatcherPortal();
  }, []);

  useEffect(() => {
    if (activeDeliveries.length === 0 || !navigator.geolocation || !dispatcherProfile) return;

    // Find ongoing delivery: assigned, picked_up, on_the_way, arrived, delayed
    const ongoingDelivery = activeDeliveries.find(d => 
      ['assigned', 'picked_up', 'on_the_way', 'arrived', 'delayed'].includes(d.status)
    );
    if (!ongoingDelivery) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await fetch(`/api/delivery/assignments/${ongoingDelivery.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              current_location: {
                lat: latitude,
                lng: longitude,
                updated_at: new Date().toISOString()
              }
            })
          });
        } catch (err) {
          console.error("Failed to update live location:", err);
        }
      },
      (err) => {
        console.error("Geolocation watch error:", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [activeDeliveries, dispatcherProfile]);

  const fetchDispatcherProfile = async (dispatcherId: string, retries = 1) => {
    try {
      const res = await fetch(`/api/dispatcher?dispatcher_id=${dispatcherId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      if (!data.profile) {
        // No profile returned at all — might have been deleted
        storageRemove('dispatcher_id');
        setLoading(false);
        return;
      }

      // Check if dispatcher is approved
      if (data.profile.application_status !== 'approved') {
        if (data.profile.application_status === 'pending') {
          setError('Your application is still pending review. Please wait for admin approval.');
        } else if (data.profile.application_status === 'rejected') {
          setError(`Your application was rejected. ${data.profile.application_notes || 'Please contact support for more information.'}`);
        }
        storageRemove('dispatcher_id');
        setLoading(false);
        return;
      }

      setDispatcherProfile(data.profile);
      setActiveDeliveries(data.active || []);
      setCompletedDeliveries(data.completed || []);
      setLoading(false);
      startPolling(dispatcherId);
    } catch (error) {
      // Retry once after a short delay before giving up
      if (retries > 0) {
        console.warn('fetchDispatcherProfile failed, retrying in 1s...', error);
        await new Promise(r => setTimeout(r, 1000));
        return fetchDispatcherProfile(dispatcherId, retries - 1);
      }
      console.error('Error fetching dispatcher profile:', error);
      storageRemove('dispatcher_id');
      setError('Failed to load dispatcher profile. Please try logging in again.');
      setLoading(false);
    }
  };

  const fetchDeliveries = async (dispatcherId: string) => {
    try {
      const res = await fetch(`/api/dispatcher?dispatcher_id=${dispatcherId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      setActiveDeliveries(data.active || []);
      setCompletedDeliveries(data.completed || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    }
  };

  const startPolling = (dispatcherId: string) => {
    // Clear any existing interval first
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    // Poll every 30 seconds (reduced from 15s to lower terminal noise)
    pollingRef.current = setInterval(() => {
      fetchDeliveries(dispatcherId);
    }, 30000);
  };

  const handleLogout = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    storageRemove('dispatcher_id');
    setDispatcherProfile(null);
    setActiveDeliveries([]);
    setCompletedDeliveries([]);
  };

  const updateDeliveryStatus = async (deliveryId: string, status: DeliveryStatus) => {
    try {
      const updates: any = { status };
      
      if (status === 'picked_up') {
        updates.picked_up_at = new Date().toISOString();
      } else if (status === 'on_the_way') {
        updates.estimated_delivery_time = new Date(Date.now() + 30 * 60000).toISOString();
      } else if (status === 'delivered') {
        updates.actual_delivery_time = new Date().toISOString();
      }

      const res = await fetch('/api/dispatcher', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryId, status, dispatcherId: dispatcherProfile?.id }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Update failed');

      if (data.active && data.completed) {
        setActiveDeliveries(data.active);
        setCompletedDeliveries(data.completed);
      } else if (dispatcherProfile) {
        await fetchDeliveries(dispatcherProfile.id);
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      alert('Failed to update status');
    }
  };

  const updateDispatcherStatus = async (status: string) => {
    try {
      const res = await fetch('/api/dispatcher', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispatcherId: dispatcherProfile?.id, status }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Update failed');
       
      if (dispatcherProfile) {
        setDispatcherProfile({ ...dispatcherProfile, status });
      }
    } catch (error) {
      console.error('Error updating dispatcher status:', error);
      alert('Failed to update status');
    }
  };

  // Removed claimOrder (admin-only assignment)

  const confirmDelivery = async (deliveryId: string, status: 'completed' | 'disputed') => {
    try {
      const res = await fetch('/api/delivery/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          deliveryId, 
          status,
          confirmer: 'dispatcher'
        }),
      });

      if (!res.ok) throw new Error('Failed to confirm delivery');

      // Refresh data
      if (dispatcherProfile) {
        await fetchDeliveries(dispatcherProfile.id);
      }
    } catch (error) {
      console.error('Error confirming delivery:', error);
      alert('Failed to confirm delivery');
    }
  };

  if (loading && !dispatcherProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in or not a dispatcher — redirect to main login
  if (!dispatcherProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Truck className="w-8 h-8 text-red-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dispatcher Portal</h1>
                <p className="text-sm text-gray-600">{dispatcherProfile.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                <select
                  value={dispatcherProfile.status}
                  onChange={(e) => updateDispatcherStatus(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600"
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="on_break">On Break</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeDeliveries.length}</p>
                <p className="text-sm text-gray-600">Active Deliveries</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{completedDeliveries.length}</p>
                <p className="text-sm text-gray-600">Completed Today</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Navigation className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {activeDeliveries.filter(d => d.status === 'on_the_way').length}
                </p>
                <p className="text-sm text-gray-600">On the Way</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Deliveries */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Active Deliveries</h2>
          <div className="space-y-4">
            {activeDeliveries.map((delivery) => (
              <motion.div
                key={delivery.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border-l-4 border-red-600 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900">Order #{delivery.orders.id.slice(0, 8)}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[delivery.status]}`}>
                          {statusLabels[delivery.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{delivery.orders.delivery_address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">${delivery.orders.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Live Map for active deliveries */}
                  {['assigned', 'picked_up', 'on_the_way', 'arrived', 'delayed'].includes(delivery.status) && delivery.orders.customer_location && (
                    <div className="mb-4">
                      <LiveMap 
                        customerLocation={delivery.orders.customer_location}
                        dispatcherLocation={delivery.current_location ? {
                          lat: delivery.current_location.lat,
                          lng: delivery.current_location.lng,
                          address: 'Dispatcher Location'
                        } : null}
                      />
                    </div>
                  )}

                  {/* Confirmation Status */}
                  {delivery.status === 'arrived' && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Delivery Confirmation</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          delivery.orders.delivery_completion_status === 'completed' ? 'bg-green-100 text-green-800' :
                          delivery.orders.delivery_completion_status === 'disputed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {delivery.orders.delivery_completion_status || 'Pending'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className={delivery.orders.customer_confirmed ? 'text-green-600' : 'text-gray-500'}>
                            Customer: {delivery.orders.customer_confirmed ? 'Confirmed' : 'Waiting'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-gray-400" />
                          <span className={delivery.orders.dispatcher_confirmed ? 'text-green-600' : 'text-gray-500'}>
                            You: {delivery.orders.dispatcher_confirmed ? 'Confirmed' : 'Waiting'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
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
                        Start Delivery
                      </button>
                    )}

                    {delivery.status === 'on_the_way' && (
                      <>
                        <button
                          onClick={() => updateDeliveryStatus(delivery.id, 'arrived')}
                          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                        >
                          <MapPin className="w-4 h-4" />
                          Mark Arrived
                        </button>
                        <button
                          onClick={() => updateDeliveryStatus(delivery.id, 'delayed')}
                          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                        >
                          <AlertCircle className="w-4 h-4" />
                          Report Delay
                        </button>
                      </>
                    )}

                    {delivery.status === 'arrived' && (
                      <>
                        <button
                          onClick={() => confirmDelivery(delivery.id, 'completed')}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Confirm Complete
                        </button>
                        <button
                          onClick={() => confirmDelivery(delivery.id, 'disputed')}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <AlertCircle className="w-4 h-4" />
                          Report Issue
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {activeDeliveries.length === 0 && (
              <div className="bg-white rounded-xl p-12 text-center">
                <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active deliveries</h3>
                <p className="text-gray-600">You have no deliveries assigned at the moment</p>
              </div>
            )}
          </div>
        </div>

        {/* Completed Deliveries */}
        {completedDeliveries.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Completed Today</h2>
            <div className="space-y-4">
              {completedDeliveries.map((delivery) => (
                <div key={delivery.id} className="bg-white rounded-xl p-6 shadow-sm opacity-75">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">Order #{delivery.orders.id.slice(0, 8)}</h3>
                      <p className="text-sm text-gray-600">{delivery.orders.delivery_address}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[delivery.status]}`}>
                      {statusLabels[delivery.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
