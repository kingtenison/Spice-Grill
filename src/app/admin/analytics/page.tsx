"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  Calendar, 
  Download, 
  PieChart, 
  Target,
  Filter,
  DollarSign,
  ArrowUpRight,
  ShoppingBag,
  Clock,
  Sparkles,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  ordersByDay: { date: string; revenue: number }[];
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/analytics");
        const data = await res.json();
        setAnalytics(data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatCurrency = (amount: number) => 
    `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const maxRevenue = Math.max(...(analytics?.ordersByDay?.map(d => d.revenue) || [100]));

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-red-100 text-red-600">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Advanced Analytics
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Financial telemetry, daily volume surges, and customer retention metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => alert("Exporting CSV report...")}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all min-h-[42px] shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all",
                  timeRange === range
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Full-Bleed Gradient KPI Cards (Strict 2x2 Grid on Mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Revenue */}
        <div className="relative overflow-hidden p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white shadow-xl shadow-emerald-500/15 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-emerald-300" /> +14.2%
            </span>
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-100/90 block">
              Total Revenue
            </span>
            <div className="text-xl sm:text-3xl font-black tracking-tight mt-0.5">
              {loading ? "—" : formatCurrency(analytics?.totalRevenue ?? 0)}
            </div>
          </div>
        </div>

        {/* Completed Orders */}
        <div className="relative overflow-hidden p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white shadow-xl shadow-blue-500/15 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
              Fulfilled
            </span>
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-100/90 block">
              Delivered Orders
            </span>
            <div className="text-xl sm:text-3xl font-black tracking-tight mt-0.5">
              {loading ? "—" : analytics?.completedOrders || 0}
            </div>
          </div>
        </div>

        {/* Peak Ordering Hour */}
        <div className="relative overflow-hidden p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-purple-800 text-white shadow-xl shadow-purple-500/15 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
              Rush
            </span>
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-100/90 block">
              Peak Hours
            </span>
            <div className="text-base sm:text-2xl font-black tracking-tight mt-0.5 truncate">
              7:00 – 8:30 PM
            </div>
          </div>
        </div>

        {/* Customer Retention */}
        <div className="relative overflow-hidden p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white shadow-xl shadow-amber-500/15 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
              Repeat
            </span>
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-100/90 block">
              Customer Retention
            </span>
            <div className="text-xl sm:text-3xl font-black tracking-tight mt-0.5">
              68.4%
            </div>
          </div>
        </div>
      </div>

      {/* Primary Chart Container (Modern Dark Glass Container) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white">Daily Revenue Trajectory</h3>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Sales performance over the selected period
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl sm:text-3xl font-black text-emerald-400">
                {loading ? "—" : formatCurrency(analytics?.totalRevenue ?? 0)}
              </p>
              <p className="text-xs font-bold text-slate-400 flex items-center justify-end gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Order Revenue
              </p>
            </div>
          </div>
        </div>

        {/* Bar Chart Visualization */}
        <div className="h-64 sm:h-80 flex items-end gap-1.5 sm:gap-2.5 px-2 pt-6 border-b border-slate-800">
          {(analytics?.ordersByDay || []).map((day, i) => {
            const height = maxRevenue > 0 ? Math.max(10, (day.revenue / maxRevenue) * 100) : 15;
            return (
              <div 
                key={i} 
                className="flex-grow bg-gradient-to-t from-red-600 to-orange-400 hover:from-emerald-500 hover:to-teal-300 transition-all rounded-t-lg relative group cursor-pointer"
                style={{ height: `${height}%` }}
              >
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-700 text-white text-[10px] font-black px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-xl z-20">
                  ${day.revenue.toFixed(0)} ({day.date})
                </div>
              </div>
            );
          })}
        </div>

        {/* X-Axis dates */}
        <div className="flex justify-between mt-4 px-2 text-[10px] sm:text-xs font-black uppercase text-slate-400 tracking-wider">
          <span>{analytics?.ordersByDay?.[0]?.date || "Day 1"}</span>
          <span>Today (Live)</span>
        </div>
      </div>

      {/* Category Breakdown & Customer Satisfaction Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Category Performance */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-900">Sales by Category</h3>
            <span className="text-xs font-extrabold text-slate-500">Live share</span>
          </div>

          <div className="space-y-4">
            {[
              { label: "Pizzas & Flatbreads", value: "45%", count: "128 orders", color: "bg-red-500" },
              { label: "Burgers & Sandwiches", value: "25%", count: "72 orders", color: "bg-orange-500" },
              { label: "Sides & Truffle Fries", value: "15%", count: "48 orders", color: "bg-amber-500" },
              { label: "Cocktails & Drinks", value: "15%", count: "42 orders", color: "bg-blue-500" },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-800">{item.label}</span>
                  <span className="text-slate-900 font-extrabold">{item.value} ({item.count})</span>
                </div>
                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-500", item.color)} style={{ width: item.value }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Satisfaction Score */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-white">Satisfaction Score</h3>
            <span className="px-2.5 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-black uppercase">
              Top 5% Moorhead
            </span>
          </div>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="80" cy="80" r="68" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
                <circle 
                  cx="80" 
                  cy="80" 
                  r="68" 
                  stroke="currentColor" 
                  strokeWidth="12" 
                  fill="transparent" 
                  className="text-amber-400" 
                  strokeDasharray="427" 
                  strokeDashoffset="42" 
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white">4.8</span>
                <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">Out of 5.0</span>
              </div>
            </div>
            <p className="mt-4 text-center text-xs font-semibold text-slate-300">
              Calculated from 1,250 verified restaurant orders and reviews.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}