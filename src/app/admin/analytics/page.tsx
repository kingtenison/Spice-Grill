"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  Calendar, 
  Download, 
  PieChart, 
  Target,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  ordersByDay: { date: string; revenue: number }[];
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

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

  const formatCurrency = (amount: number) => `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold mb-1 text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600">Deep dive into your restaurant&apos;s performance metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 font-bold hover:bg-gray-50 transition-all">
            <Download className="w-4 h-4" /> Export Report
          </button>
          <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-500 text-white font-bold shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all">
            <Filter className="w-4 h-4" /> Last 30 Days
          </button>
        </div>
      </div>

      {/* Primary Chart Placeholder */}
      <div className="p-8 rounded-[2.5rem] bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Revenue Growth</h3>
            <p className="text-sm text-gray-600 font-medium">Daily revenue over the last 30 days</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-red-500">{loading ? "—" : formatCurrency(analytics?.totalRevenue ?? 0)}</p>
            <p className="text-sm font-bold text-green-600 flex items-center justify-end gap-1">
              <TrendingUp className="w-4 h-4" /> +15.4%
            </p>
          </div>
        </div>

        {/* Visual Chart Placeholder */}
        <div className="h-80 flex items-end gap-2 px-4">
          {[40, 60, 45, 70, 90, 55, 80, 100, 75, 65, 85, 110, 95, 120, 130].map((h, i) => (
            <div 
              key={i} 
              className="flex-grow bg-red-100 hover:bg-red-500 transition-all rounded-t-lg relative group"
              style={{ height: `${h}%` }}
            >
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                ${(h * 100).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-6 px-4 text-[10px] font-black uppercase text-gray-500 tracking-widest">
          <span>Oct 01</span>
          <span>Oct 15</span>
          <span>Oct 31</span>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: "Peak Ordering Hour", value: "7:00 PM - 8:30 PM", desc: "45% of daily volume", icon: Calendar },
          { title: "Top Selling Item", value: loading ? "—" : "Hibiscus Iced Tea", desc: loading ? "—" : "124 sold this week", icon: Target },
          { title: "Customer Retention", value: "68%", desc: "+5% from last month", icon: PieChart },
        ].map((insight, i) => (
          <div key={i} className="p-8 rounded-[2.5rem] bg-white border border-gray-200 shadow-sm flex flex-col gap-6">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <insight.icon className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">{insight.title}</p>
              <h4 className="text-2xl font-black mb-1 text-gray-900">{insight.value}</h4>
              <p className="text-sm font-medium text-gray-600">{insight.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Performance */}
        <div className="p-8 rounded-[2.5rem] bg-white border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold mb-8 text-gray-900">Sales by Category</h3>
          <div className="space-y-6">
            {[
              { label: "Pizzas", value: "45%", color: "bg-red-500" },
              { label: "Burgers", value: "25%", color: "bg-orange-400" },
              { label: "Salads", value: "15%", color: "bg-green-400" },
              { label: "Drinks", value: "15%", color: "bg-blue-400" },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-sm font-bold uppercase tracking-widest">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="text-gray-900">{item.value}</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", item.color)} style={{ width: item.value }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Satisfaction */}
        <div className="p-8 rounded-[2.5rem] bg-gray-50 text-gray-900 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />
           <h3 className="text-xl font-bold mb-8 text-gray-900">Satisfaction Score</h3>
           <div className="flex flex-col items-center justify-center py-10">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-300" />
                  <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-red-500" strokeDasharray="440" strokeDashoffset="44" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-gray-900">4.8</span>
                  <span className="text-[10px] font-black uppercase text-gray-500">Out of 5</span>
                </div>
              </div>
              <p className="mt-8 text-center text-sm font-medium text-gray-600">Based on 1,250 reviews from the last month.</p>
           </div>
        </div>
      </div>
    </div>
  );
}