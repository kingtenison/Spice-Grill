"use client";

import { useState, useEffect } from "react";
import {
  DollarSign, TrendingUp, TrendingDown, Users, Truck, Filter,
  Download, RefreshCw, ChevronDown, ChevronUp, Wallet, CreditCard
} from "lucide-react";

interface Transaction {
  id: string;
  order_id: string;
  delivery_fee: number;
  service_fee: number;
  small_order_fee: number;
  total_collected: number;
  dispatcher_payout: number;
  platform_net: number;
  distance_miles: number;
  created_at: string;
  dispatcher_name: string | null;
  orders: {
    id: string;
    total_amount: number;
    delivery_address: string;
    created_at: string;
    status: string;
  };
}

interface DispatcherBreakdown {
  dispatcher_id: string;
  name: string;
  total_earned: number;
  total_deliveries: number;
  pending: number;
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
}

interface DashboardSummary {
  total_revenue: number;
  total_dispatcher_payout: number;
  total_platform_net: number;
  total_delivery_fees: number;
  total_service_fees: number;
  total_small_order_fees: number;
  pending_payouts: number;
  total_orders: number;
}

export default function FinancialDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dispatchers, setDispatchers] = useState<DispatcherBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"transactions" | "dispatchers" | "rates">("transactions");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);

      const [dashboardRes, settingsRes] = await Promise.all([
        fetch(`/api/admin/financial-dashboard?${params}`),
        fetch("/api/admin/delivery-settings"),
      ]);

      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        setSummary(data.summary);
        setTransactions(data.transactions || []);
        setDispatchers(data.dispatcher_breakdown || []);
      }

      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setDeliverySettings(settings);
      }
    } catch (e) {
      console.error("Failed to load financial data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600">Track all monetary transactions and delivery earnings.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Date Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
        </div>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900"
        />
        <span className="text-gray-500">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900"
        />
        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(""); setEndDate(""); }}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Revenue</span>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_revenue)}</p>
            <p className="text-xs text-gray-500 mt-1">{summary.total_orders} orders</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Dispatcher Payouts</span>
              <Truck className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.total_dispatcher_payout)}</p>
            <p className="text-xs text-gray-500 mt-1">{formatCurrency(summary.pending_payouts)} pending</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Platform Net</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.total_platform_net)}</p>
            <p className="text-xs text-gray-500 mt-1">After dispatcher pay</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Fee Breakdown</span>
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span className="font-medium">{formatCurrency(summary.total_delivery_fees)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-medium">{formatCurrency(summary.total_service_fees)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Small Order</span><span className="font-medium">{formatCurrency(summary.total_small_order_fees)}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("transactions")}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${activeTab === "transactions" ? "border-red-600 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          Per-Delivery Transactions
        </button>
        <button
          onClick={() => setActiveTab("dispatchers")}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${activeTab === "dispatchers" ? "border-red-600 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          Dispatcher Earnings
        </button>
        <button
          onClick={() => setActiveTab("rates")}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${activeTab === "rates" ? "border-red-600 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          Active Rates
        </button>
      </div>

      {/* Transactions Table */}
      {activeTab === "transactions" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No transactions found. Fees will appear here once orders with delivery fees are placed.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold text-gray-600">Order</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600">Date</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600">Distance</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600">Delivery Fee</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600">Service Fee</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600">Small Order</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600">Total Collected</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600">Driver Pay</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600">Platform Net</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600">Dispatcher</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedRow(expandedRow === t.id ? null : t.id)}>
                      <td className="px-4 py-3 font-medium text-gray-900">#{t.order_id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-4 py-3 text-gray-600">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{t.distance_miles.toFixed(1)} mi</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(t.delivery_fee)}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(t.service_fee)}</td>
                      <td className="px-4 py-3 text-right font-medium text-orange-600">{t.small_order_fee > 0 ? formatCurrency(t.small_order_fee) : "-"}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(t.total_collected)}</td>
                      <td className="px-4 py-3 text-right font-medium text-orange-600">{formatCurrency(t.dispatcher_payout)}</td>
                      <td className="px-4 py-3 text-right font-bold text-blue-600">{formatCurrency(t.platform_net)}</td>
                      <td className="px-4 py-3 text-gray-600">{t.dispatcher_name || "Unassigned"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Dispatcher Breakdown */}
      {activeTab === "dispatchers" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading...</div>
          ) : dispatchers.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No dispatcher earnings yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold text-gray-600">Dispatcher</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600">Total Deliveries</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600">Total Earned</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600">Pending Payout</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600">Avg Per Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dispatchers.map((d) => (
                    <tr key={d.dispatcher_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{d.total_deliveries}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(d.total_earned)}</td>
                      <td className="px-4 py-3 text-right font-medium text-orange-600">{formatCurrency(d.pending)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{d.total_deliveries > 0 ? formatCurrency(d.total_earned / d.total_deliveries) : "$0.00"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {/* Active Rates */}
      {activeTab === "rates" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Current Active Delivery Rates</h3>
          {!deliverySettings ? (
            <div className="text-gray-500">Loading rates...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <RateCard label="Base Delivery Fee" value={formatCurrency(deliverySettings.delivery_fee)} subtext="Flat fee per delivery" />
              <RateCard label="Service Fee" value={formatCurrency(deliverySettings.service_fee)} subtext={`Within ${deliverySettings.service_fee_radius_miles} mi radius`} />
              <RateCard label="Per-Mile Rate" value={`${formatCurrency(deliverySettings.per_mile_rate)}/mi`} subtext="After free radius" />
              <RateCard label="Free Delivery Radius" value={`${deliverySettings.free_delivery_radius_miles} mi`} subtext="No delivery fee within this range" />
              <RateCard label="Small Order Threshold" value={`< ${formatCurrency(deliverySettings.small_order_threshold)}`} subtext="Triggers small order fee" />
              <RateCard label="Small Order Fee" value={formatCurrency(deliverySettings.small_order_fee)} subtext="Extra fee for small orders" />
              <RateCard label="Driver Base Pay" value={formatCurrency(deliverySettings.driver_base_pay)} subtext="Guaranteed per delivery" />
              <RateCard label="Driver Mileage Pay" value={`${formatCurrency(deliverySettings.driver_mileage_pay)}/mi`} subtext="Distance-based bonus" />
            </div>
          )}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <a href="/admin/settings" className="text-sm text-red-600 font-bold hover:underline">Edit rates in Settings →</a>
          </div>
        </div>
      )}
    </div>
  );
}

function RateCard({ label, value, subtext }: { label: string; value: string; subtext: string }) {
  return (
    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{subtext}</p>
    </div>
  );
}
