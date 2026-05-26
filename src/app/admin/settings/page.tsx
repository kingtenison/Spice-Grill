"use client";

import { useState } from "react";
import { Save, Store, Truck, Bell, Shield, Globe } from "lucide-react";

interface SettingsState {
  restaurantName: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  deliveryFee: number;
  taxRate: number;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({
    restaurantName: "Spice Grille",
    address: "123 Main Street, Lagos",
    phone: "+234 800 000 0000",
    email: "info@spicegrille.com",
    currency: "NGN",
    deliveryFee: 1500,
    taxRate: 7.5,
  });

  const updateSetting = (key: keyof SettingsState, value: string | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure your restaurant and system preferences.</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-bold shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all">
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
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
                  value={settings.restaurantName}
                  onChange={(e) => updateSetting("restaurantName", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-medium text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Phone</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => updateSetting("phone", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-medium text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => updateSetting("email", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-medium text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => updateSetting("currency", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-medium text-gray-900"
                >
                  <option>NGN</option>
                  <option>USD</option>
                  <option>GBP</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Address</label>
                <textarea
                  value={settings.address}
                  onChange={(e) => updateSetting("address", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-medium resize-none text-gray-900"
                />
              </div>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <Truck className="w-5 h-5 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900">Delivery Settings</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Delivery Fee ($)</label>
                <input
                  type="number"
                  value={settings.deliveryFee}
                  onChange={(e) => updateSetting("deliveryFee", Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-medium text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.taxRate}
                  onChange={(e) => updateSetting("taxRate", Number(e.target.value))}
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