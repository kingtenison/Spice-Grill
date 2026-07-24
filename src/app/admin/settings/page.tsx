"use client";

import { useState, useEffect } from "react";
import { Save, Store, Truck, Bell, Shield, Globe } from "lucide-react";

interface RestaurantSettings {
  restaurantName: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
}

interface DeliverySettings {
  delivery_fee: number;
  service_fee: number;
  service_fee_radius_miles: number;
  per_mile_rate: number;
  free_delivery_radius_miles: number;
  small_order_threshold: number;
  small_order_fee: number;
  driver_base_pay: number;
  driver_mileage_pay: number;
  restaurant_lat: number;
  restaurant_lng: number;
}

export default function AdminSettingsPage() {
  const [restaurant, setRestaurant] = useState<RestaurantSettings>({
    restaurantName: "Spice Grille",
    address: "320 Red River Ave Ste D, Moorhead, MN",
    phone: "+1 701 000 0000",
    email: "info@thespicegrille.com",
    currency: "USD",
  });

  const [delivery, setDelivery] = useState<DeliverySettings>({
    delivery_fee: 3.99,
    service_fee: 4.00,
    service_fee_radius_miles: 5.0,
    per_mile_rate: 0.70,
    free_delivery_radius_miles: 0,
    small_order_threshold: 15.00,
    small_order_fee: 2.50,
    driver_base_pay: 3.00,
    driver_mileage_pay: 0.70,
    restaurant_lat: 46.8772,
    restaurant_lng: -96.7898,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/admin/delivery-settings");
        if (res.ok) {
          const data = await res.json();
          setDelivery({
            delivery_fee: data.delivery_fee ?? 3.99,
            service_fee: data.service_fee ?? 4.00,
            service_fee_radius_miles: data.service_fee_radius_miles ?? 5.0,
            per_mile_rate: data.per_mile_rate ?? 0.70,
            free_delivery_radius_miles: data.free_delivery_radius_miles ?? 0,
            small_order_threshold: data.small_order_threshold ?? 15.00,
            small_order_fee: data.small_order_fee ?? 2.50,
            driver_base_pay: data.driver_base_pay ?? 3.00,
            driver_mileage_pay: data.driver_mileage_pay ?? 0.70,
            restaurant_lat: data.restaurant_lat ?? 46.8772,
            restaurant_lng: data.restaurant_lng ?? -96.7898,
          });
        }
      } catch (e) {
        console.error("Failed to load delivery settings:", e);
      }
    };
    loadSettings();
  }, []);

  const saveSettings = async () => {
    setIsSaving(true);
    setSaveMessage("");
    try {
      const res = await fetch("/api/admin/delivery-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(delivery),
      });
      if (res.ok) {
        const reload = await fetch("/api/admin/delivery-settings");
        if (reload.ok) {
          const data = await reload.json();
          setDelivery({
            delivery_fee: data.delivery_fee ?? 3.99,
            service_fee: data.service_fee ?? 4.00,
            service_fee_radius_miles: data.service_fee_radius_miles ?? 5.0,
            per_mile_rate: data.per_mile_rate ?? 0.70,
            free_delivery_radius_miles: data.free_delivery_radius_miles ?? 0,
            small_order_threshold: data.small_order_threshold ?? 15.00,
            small_order_fee: data.small_order_fee ?? 2.50,
            driver_base_pay: data.driver_base_pay ?? 3.00,
            driver_mileage_pay: data.driver_mileage_pay ?? 0.70,
            restaurant_lat: data.restaurant_lat ?? 46.8772,
            restaurant_lng: data.restaurant_lng ?? -96.7898,
          });
        }
        setSaveMessage("Settings saved successfully!");
      } else {
        setSaveMessage("Failed to save settings");
      }
    } catch (e) {
      setSaveMessage("Failed to save settings");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  const updateDelivery = (key: keyof DeliverySettings, value: number) => {
    setDelivery(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure your restaurant and delivery preferences.</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-bold shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-xl ${saveMessage.includes("success") ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {saveMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Restaurant Info */}
          <div className="p-8 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <Store className="w-5 h-5 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900">Restaurant Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Restaurant Name</label>
                <input
                  type="text"
                  value={restaurant.restaurantName}
                  onChange={(e) => setRestaurant(prev => ({ ...prev, restaurantName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-medium text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Phone</label>
                <input
                  type="text"
                  value={restaurant.phone}
                  onChange={(e) => setRestaurant(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-medium text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Email</label>
                <input
                  type="email"
                  value={restaurant.email}
                  onChange={(e) => setRestaurant(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-medium text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Currency</label>
                <select
                  value={restaurant.currency}
                  onChange={(e) => setRestaurant(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-medium text-gray-900"
                >
                  <option>USD</option>
                  <option>NGN</option>
                  <option>GBP</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Address</label>
                <textarea
                  value={restaurant.address}
                  onChange={(e) => setRestaurant(prev => ({ ...prev, address: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-medium resize-none text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Delivery Fee Settings */}
          <div className="p-8 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <Truck className="w-5 h-5 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900">Delivery Fee Settings</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Base Delivery Fee ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={delivery.delivery_fee}
                  onChange={(e) => updateDelivery("delivery_fee", Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-medium text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Service Fee ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={delivery.service_fee}
                  onChange={(e) => updateDelivery("service_fee", Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-medium text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Service Fee Radius (miles)</label>
                <input
                  type="number"
                  step="0.1"
                  value={delivery.service_fee_radius_miles}
                  onChange={(e) => updateDelivery("service_fee_radius_miles", Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-medium text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Per-Mile Rate After Radius ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={delivery.per_mile_rate}
                  onChange={(e) => updateDelivery("per_mile_rate", Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-medium text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Free Delivery Radius (miles)</label>
                <input
                  type="number"
                  step="0.1"
                  value={delivery.free_delivery_radius_miles}
                  onChange={(e) => updateDelivery("free_delivery_radius_miles", Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-medium text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Small Order Threshold ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={delivery.small_order_threshold}
                  onChange={(e) => updateDelivery("small_order_threshold", Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-medium text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Small Order Fee ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={delivery.small_order_fee}
                  onChange={(e) => updateDelivery("small_order_fee", Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-medium text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Dispatcher Pay Settings */}
          <div className="p-8 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <Truck className="w-5 h-5 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900">Dispatcher Pay Settings</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Base Pay Per Delivery ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={delivery.driver_base_pay}
                  onChange={(e) => updateDelivery("driver_base_pay", Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-medium text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Mileage Pay ($/mile)</label>
                <input
                  type="number"
                  step="0.01"
                  value={delivery.driver_mileage_pay}
                  onChange={(e) => updateDelivery("driver_mileage_pay", Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-medium text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Restaurant Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={delivery.restaurant_lat}
                  onChange={(e) => updateDelivery("restaurant_lat", Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-medium text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Restaurant Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={delivery.restaurant_lng}
                  onChange={(e) => updateDelivery("restaurant_lng", Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-medium text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <h4 className="font-bold mb-4 text-gray-900">Quick Actions</h4>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all flex items-center gap-3">
                <Shield className="w-4 h-4 text-red-600" />
                <span className="font-medium text-gray-900">Security Settings</span>
              </button>
              <button className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all flex items-center gap-3">
                <Bell className="w-4 h-4 text-red-600" />
                <span className="font-medium text-gray-900">Notification Preferences</span>
              </button>
              <button className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all flex items-center gap-3">
                <Globe className="w-4 h-4 text-red-600" />
                <span className="font-medium text-gray-900">Language & Region</span>
              </button>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <h4 className="font-bold mb-2 text-gray-900">System Status</h4>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-gray-600">All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
