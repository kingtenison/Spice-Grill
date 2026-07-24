"use client";

import { useState, useEffect } from "react";
import { DollarSign, ArrowLeft, TrendingUp, Clock, CheckCircle, Wallet } from "lucide-react";
import Link from "next/link";

interface Earning {
  id: string;
  order_id: string;
  distance_miles: number;
  base_pay: number;
  mileage_pay: number;
  total_earned: number;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
  orders: {
    id: string;
    total_amount: number;
    delivery_address: string;
    created_at: string;
  };
}

interface EarningsSummary {
  total_earned: number;
  total_paid: number;
  pending_payout: number;
  total_deliveries: number;
}

export default function DispatcherEarningsPage() {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dispatcherId = localStorage.getItem("dispatcher_id");
    if (!dispatcherId) {
      window.location.href = "/dispatcher";
      return;
    }

    const fetchEarnings = async () => {
      try {
        const res = await fetch(`/api/dispatcher/earnings?dispatcher_id=${dispatcherId}`);
        if (res.ok) {
          const data = await res.json();
          setEarnings(data.earnings || []);
          setSummary(data.summary);
        }
      } catch (e) {
        console.error("Failed to load earnings:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container px-4 pt-24 pb-12 mx-auto max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dispatcher" className="p-2 rounded-lg bg-white border border-gray-200 hover:border-red-600 hover:text-red-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">My Earnings</h1>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Total Earned</span>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">${summary.total_earned.toFixed(2)}</p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Pending Payout</span>
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-600">${summary.pending_payout.toFixed(2)}</p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Total Paid</span>
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">${summary.total_paid.toFixed(2)}</p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Deliveries</span>
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{summary.total_deliveries}</p>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="flex gap-4 mb-8">
          <Link
            href="/dispatcher/payment-settings"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:border-red-300 transition-colors text-sm font-medium"
          >
            <Wallet className="w-4 h-4" />
            Payment Settings
          </Link>
        </div>

        {/* Earnings History */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Earnings History</h2>
          </div>

          {earnings.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No earnings yet. Earnings will appear here after completed deliveries.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold text-gray-600">Order</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600">Date</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600">Distance</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600">Base Pay</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600">Mileage Pay</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600">Total Earned</th>
                    <th className="text-center px-4 py-3 font-bold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {earnings.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">#{e.order_id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-4 py-3 text-gray-600">{new Date(e.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{e.distance_miles.toFixed(1)} mi</td>
                      <td className="px-4 py-3 text-right text-gray-900">${e.base_pay.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-900">${e.mileage_pay.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">${e.total_earned.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        {e.is_paid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
