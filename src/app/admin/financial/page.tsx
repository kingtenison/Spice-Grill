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

      {/* Summary Cards: Strict 2x2 on Mobile, 4 Columns on Desktop with Full-Bleed Gradients */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4.5">
          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white shadow-lg shadow-emerald-950/20 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-emerald-100">Revenue</span>
            </div>
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-100/80 mb-0.5">Total Collected</p>
            <p className="text-xl sm:text-3xl font-black text-white tracking-tight">{formatCurrency(summary.total_revenue)}</p>
            <p className="text-[10px] sm:text-xs text-emerald-100/70 mt-1 font-semibold">{summary.total_orders} settled orders</p>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 text-white shadow-lg shadow-amber-950/20 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-amber-100">Payouts</span>
            </div>
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-100/80 mb-0.5">Driver Earnings</p>
            <p className="text-xl sm:text-3xl font-black text-white tracking-tight">{formatCurrency(summary.total_dispatcher_payout)}</p>
            <p className="text-[10px] sm:text-xs text-amber-100/70 mt-1 font-semibold">{formatCurrency(summary.pending_payouts)} pending</p>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white shadow-lg shadow-blue-950/20 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-blue-100">Profit</span>
            </div>
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-blue-100/80 mb-0.5">Platform Net</p>
            <p className="text-xl sm:text-3xl font-black text-white tracking-tight">{formatCurrency(summary.total_platform_net)}</p>
            <p className="text-[10px] sm:text-xs text-blue-100/70 mt-1 font-semibold">Net platform retention</p>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-purple-800 text-white shadow-lg shadow-purple-950/20 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-purple-100">Fees</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-purple-100/80"><span className="font-medium">Delivery:</span><span className="font-black text-white">{formatCurrency(summary.total_delivery_fees)}</span></div>
              <div className="flex justify-between text-purple-100/80"><span className="font-medium">Service:</span><span className="font-black text-white">{formatCurrency(summary.total_service_fees)}</span></div>
              <div className="flex justify-between text-purple-100/80"><span className="font-medium">Small Order:</span><span className="font-black text-white">{formatCurrency(summary.total_small_order_fees)}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("transactions")}
          className={`pb-2.5 px-4 text-xs sm:text-sm font-extrabold border-b-2 transition-all whitespace-nowrap ${activeTab === "transactions" ? "border-red-600 text-red-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          Delivery Transactions
        </button>
        <button
          onClick={() => setActiveTab("dispatchers")}
          className={`pb-2.5 px-4 text-xs sm:text-sm font-extrabold border-b-2 transition-all whitespace-nowrap ${activeTab === "dispatchers" ? "border-red-600 text-red-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          Dispatcher Earnings
        </button>
        <button
          onClick={() => setActiveTab("rates")}
          className={`pb-2.5 px-4 text-xs sm:text-sm font-extrabold border-b-2 transition-all whitespace-nowrap ${activeTab === "rates" ? "border-red-600 text-red-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          Active Fee Rates
        </button>
      </div>

      {/* Transactions Section */}
      {activeTab === "transactions" && (
        <div className="space-y-4">
          {/* Mobile 2x2 Grid of Transactions */}
          <div className="md:hidden grid grid-cols-2 gap-2.5">
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="p-4 bg-white rounded-2xl border border-slate-200 animate-pulse space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-6 bg-slate-200 rounded" />
                </div>
              ))
            ) : transactions.length === 0 ? (
              <div className="col-span-2 p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
                No transactions recorded yet.
              </div>
            ) : (
              transactions.map(t => (
                <div key={t.id} className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-black text-xs text-slate-900">#{t.order_id?.slice(-5)?.toUpperCase()}</span>
                      <span className="text-[9px] font-bold text-slate-400">{t.distance_miles ? `${t.distance_miles.toFixed(1)} mi` : "Local"}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 space-y-1 mb-2 text-[10px]">
                      <div className="flex justify-between"><span className="text-slate-500">Total:</span><span className="font-bold text-slate-900">{formatCurrency(t.total_collected)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Driver:</span><span className="font-bold text-amber-600">{formatCurrency(t.dispatcher_payout)}</span></div>
                      <div className="flex justify-between pt-1 border-t border-slate-200"><span className="text-slate-500 font-bold">Net:</span><span className="font-black text-emerald-600">{formatCurrency(t.platform_net)}</span></div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold truncate">
                    {t.dispatcher_name || "Unassigned"}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-500">No transactions found. Fees will appear here once orders with delivery fees are placed.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500">
                    <tr>
                      <th className="text-left px-4 py-3">Order</th>
                      <th className="text-left px-4 py-3">Date</th>
                      <th className="text-right px-4 py-3">Distance</th>
                      <th className="text-right px-4 py-3">Delivery Fee</th>
                      <th className="text-right px-4 py-3">Service Fee</th>
                      <th className="text-right px-4 py-3">Small Order</th>
                      <th className="text-right px-4 py-3">Total Collected</th>
                      <th className="text-right px-4 py-3">Driver Pay</th>
                      <th className="text-right px-4 py-3">Platform Net</th>
                      <th className="text-left px-4 py-3">Dispatcher</th>
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
