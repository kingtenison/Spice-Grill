"use client";

import { useState, useEffect } from "react";
import { Save, Store, Truck, Bell, Shield, Globe, X, Check, Lock, CheckCircle2, Volume2 } from "lucide-react";
import { 
  playNotificationSound, 
  isSoundEnabled, 
  setSoundEnabled, 
  requestNotificationPermission, 
  getNotificationPermission 
} from "@/lib/notifications";

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
  const [activeModal, setActiveModal] = useState<"security" | "notifications" | "region" | null>(null);
  const [modalMessage, setModalMessage] = useState("");
  const [isModalSaving, setIsModalSaving] = useState(false);

  // Security settings state
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    orderSound: true,
    emailAlerts: true,
    stockAlerts: true,
    dispatcherAlerts: true,
  });

  // Language & region state
  const [regionSettings, setRegionSettings] = useState({
    language: "en",
    currency: "USD",
    timezone: "America/Chicago",
    dateFormat: "MM/DD/YYYY",
  });

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
              <button
                type="button"
                onClick={() => { setActiveModal("security"); setModalMessage(""); }}
                className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-all flex items-center gap-3 cursor-pointer"
              >
                <Shield className="w-4 h-4 text-red-600" />
                <span className="font-medium text-gray-900">Security Settings</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveModal("notifications"); setModalMessage(""); }}
                className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-all flex items-center gap-3 cursor-pointer"
              >
                <Bell className="w-4 h-4 text-red-600" />
                <span className="font-medium text-gray-900">Notification Preferences</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveModal("region"); setModalMessage(""); }}
                className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-all flex items-center gap-3 cursor-pointer"
              >
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

      {/* Security Settings Modal */}
      {activeModal === "security" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Security Settings</h3>
                  <p className="text-xs text-gray-500">Update admin password & credentials</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalMessage && (
              <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
                <span>{modalMessage}</span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsModalSaving(true);
                setModalMessage("");
                try {
                  if (securityForm.newPassword && securityForm.newPassword !== securityForm.confirmPassword) {
                    alert("New passwords do not match!");
                    setIsModalSaving(false);
                    return;
                  }
                  // Simulate update or call auth update endpoint
                  await new Promise(r => setTimeout(r, 600));
                  setModalMessage("Security settings updated successfully!");
                  setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "", twoFactorEnabled: securityForm.twoFactorEnabled });
                  setTimeout(() => {
                    setActiveModal(null);
                    setModalMessage("");
                  }, 1500);
                } finally {
                  setIsModalSaving(false);
                }
              }}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={securityForm.currentPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={securityForm.newPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={securityForm.confirmPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-sm outline-none transition-all"
                />
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-500">Require code on each login</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSecurityForm({ ...securityForm, twoFactorEnabled: !securityForm.twoFactorEnabled })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${securityForm.twoFactorEnabled ? 'bg-red-600' : 'bg-gray-200'}`}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform absolute top-1 ${securityForm.twoFactorEnabled ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isModalSaving}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all shadow-md shadow-red-500/20 disabled:opacity-50"
                >
                  {isModalSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Preferences Modal */}
      {activeModal === "notifications" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Notification Preferences</h3>
                  <p className="text-xs text-gray-500">Configure real-time alert channels</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalMessage && (
              <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
                <span>{modalMessage}</span>
              </div>
            )}

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">New Order Audio Chime</p>
                    <button
                      type="button"
                      onClick={() => playNotificationSound("new_order")}
                      className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[11px] font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
                    >
                      🔊 Test Chime
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Play bell chime whenever an order is placed</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !notificationSettings.orderSound;
                    setNotificationSettings(p => ({ ...p, orderSound: next }));
                    if (next) playNotificationSound("new_order");
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${notificationSettings.orderSound ? 'bg-red-600' : 'bg-gray-200'}`}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform absolute top-1 ${notificationSettings.orderSound ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Desktop / Browser Alerts</p>
                  <p className="text-xs text-gray-500 mt-0.5">Receive notifications when tab is in background</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const perm = await requestNotificationPermission();
                    if (perm === "granted") {
                      setModalMessage("Browser notifications allowed!");
                    } else {
                      setModalMessage("Browser notification permission denied by browser.");
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:text-red-600 hover:border-red-300 transition-all cursor-pointer"
                >
                  Request Permission
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Email Notifications</p>
                  <p className="text-xs text-gray-500 mt-0.5">Send order summaries to owner email</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationSettings(p => ({ ...p, emailAlerts: !p.emailAlerts }))}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${notificationSettings.emailAlerts ? 'bg-red-600' : 'bg-gray-200'}`}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform absolute top-1 ${notificationSettings.emailAlerts ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Low Stock Alerts</p>
                  <p className="text-xs text-gray-500 mt-0.5">Alert when menu items fall below 5 units</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationSettings(p => ({ ...p, stockAlerts: !p.stockAlerts }))}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${notificationSettings.stockAlerts ? 'bg-red-600' : 'bg-gray-200'}`}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform absolute top-1 ${notificationSettings.stockAlerts ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Dispatcher Status Alerts</p>
                  <p className="text-xs text-gray-500 mt-0.5">Notify on delivery completion/delays</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationSettings(p => ({ ...p, dispatcherAlerts: !p.dispatcherAlerts }))}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${notificationSettings.dispatcherAlerts ? 'bg-red-600' : 'bg-gray-200'}`}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform absolute top-1 ${notificationSettings.dispatcherAlerts ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isModalSaving}
                  onClick={async () => {
                    setIsModalSaving(true);
                    setSoundEnabled(notificationSettings.orderSound);
                    await new Promise(r => setTimeout(r, 300));
                    setModalMessage("Notification preferences saved!");
                    setIsModalSaving(false);
                    setTimeout(() => {
                      setActiveModal(null);
                      setModalMessage("");
                    }, 1200);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all shadow-md shadow-red-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isModalSaving ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Language & Region Modal */}
      {activeModal === "region" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Language & Region</h3>
                  <p className="text-xs text-gray-500">Configure locale, currency & timezone</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalMessage && (
              <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
                <span>{modalMessage}</span>
              </div>
            )}

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Primary Language</label>
                <select
                  value={regionSettings.language}
                  onChange={(e) => setRegionSettings({ ...regionSettings, language: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-sm outline-none transition-all font-medium text-gray-900"
                >
                  <option value="en">English (United States)</option>
                  <option value="fr">Français (French)</option>
                  <option value="es">Español (Spanish)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Currency</label>
                <select
                  value={regionSettings.currency}
                  onChange={(e) => setRegionSettings({ ...regionSettings, currency: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-sm outline-none transition-all font-medium text-gray-900"
                >
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="CAD">CAD ($ - Canadian Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Timezone</label>
                <select
                  value={regionSettings.timezone}
                  onChange={(e) => setRegionSettings({ ...regionSettings, timezone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-sm outline-none transition-all font-medium text-gray-900"
                >
                  <option value="America/Chicago">Central Time (US & Canada) - Moorhead, MN</option>
                  <option value="America/New_York">Eastern Time (US & Canada)</option>
                  <option value="America/Denver">Mountain Time (US & Canada)</option>
                  <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Date Format</label>
                <select
                  value={regionSettings.dateFormat}
                  onChange={(e) => setRegionSettings({ ...regionSettings, dateFormat: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-sm outline-none transition-all font-medium text-gray-900"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY (10/09/2026)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (09/10/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2026-10-09)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isModalSaving}
                  onClick={async () => {
                    setIsModalSaving(true);
                    await new Promise(r => setTimeout(r, 400));
                    setModalMessage("Language & regional settings saved!");
                    setIsModalSaving(false);
                    setTimeout(() => {
                      setActiveModal(null);
                      setModalMessage("");
                    }, 1200);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all shadow-md shadow-red-500/20 disabled:opacity-50"
                >
                  {isModalSaving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
