"use client";

import { useState } from "react";
import { Award, Save, Info, Sparkles, Gift, Check, Crown, Shield, Star, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tier {
  name: string;
  min: number;
  max: number;
  benefit: string;
  badge: string;
  gradient: string;
  accent: string;
}

const DEFAULT_RULES = {
  pointsPerDollar: 1,
  tiers: [
    { 
      name: "Bronze", 
      min: 0, 
      max: 500, 
      benefit: "Standard point accrual", 
      badge: "Member",
      gradient: "from-amber-800 via-amber-900 to-stone-900 border-amber-700/40 text-amber-100",
      accent: "bg-amber-700/40 text-amber-200 border-amber-600/40"
    },
    { 
      name: "Silver", 
      min: 501, 
      max: 2000, 
      benefit: "5% automatic checkout discount", 
      badge: "Silver VIP",
      gradient: "from-slate-600 via-zinc-700 to-slate-900 border-slate-400/40 text-slate-100",
      accent: "bg-slate-500/40 text-slate-200 border-slate-400/40"
    },
    { 
      name: "Gold", 
      min: 2001, 
      max: Infinity, 
      benefit: "10% auto discount + priority prep", 
      badge: "Gold Elite",
      gradient: "from-amber-500 via-yellow-600 to-amber-700 border-yellow-300/50 text-slate-950",
      accent: "bg-black/25 text-amber-950 border-black/20"
    },
  ],
  redemptionOptions: [
    { points: 200, reward: "Free Truffle Fries", value: "$8.99 Value", gradient: "from-emerald-600 via-teal-700 to-emerald-900" },
    { points: 350, reward: "Signature Mocktail", value: "$11.50 Value", gradient: "from-purple-600 via-indigo-700 to-purple-950" },
    { points: 500, reward: "$10 Off Total Bill", value: "$10.00 Credit", gradient: "from-blue-600 via-indigo-700 to-blue-900" },
    { points: 850, reward: "Chef Grill Platter", value: "$24.99 Value", gradient: "from-rose-600 via-red-700 to-rose-950" },
  ]
};

export default function AdminLoyaltyPage() {
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 600);
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Award className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Loyalty Program & Tiers
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Configure how customers earn rewards, unlock VIP tiers, and redeem gift vouchers.
          </p>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-red-500/25 active:scale-[0.98] transition-all min-h-[44px] disabled:opacity-60"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" /> Saved Successfully!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Configuration"}
            </>
          )}
        </button>
      </div>

      {/* Top 4 KPI Cards (Strict 2x2 Grid on Mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Points Ratio */}
        <div className="relative overflow-hidden p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 text-white shadow-xl shadow-amber-500/15 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
              Current
            </span>
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-100 block">
              Earn Multiplier
            </span>
            <div className="text-xl sm:text-3xl font-black mt-0.5">
              {rules.pointsPerDollar} pt / $1
            </div>
          </div>
        </div>

        {/* Bronze Members */}
        <div className="relative overflow-hidden p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-stone-700 via-amber-900 to-stone-900 text-white shadow-xl shadow-stone-800/20 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
              Tier 1
            </span>
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-200 block">
              Bronze Tier
            </span>
            <div className="text-xl sm:text-3xl font-black mt-0.5">1,240 users</div>
          </div>
        </div>

        {/* Silver VIPs */}
        <div className="relative overflow-hidden p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-600 via-zinc-700 to-slate-900 text-white shadow-xl shadow-slate-700/20 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-slate-200" />
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
              Tier 2
            </span>
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-200 block">
              Silver VIP (5%)
            </span>
            <div className="text-xl sm:text-3xl font-black mt-0.5">485 users</div>
          </div>
        </div>

        {/* Gold Elite */}
        <div className="relative overflow-hidden p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-yellow-500 via-amber-600 to-yellow-700 text-slate-950 shadow-xl shadow-amber-500/20 border border-yellow-300/40 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-black/20 backdrop-blur-md flex items-center justify-center border border-black/20">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-950" />
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-black/20 text-slate-950 backdrop-blur-sm">
              VIP Elite
            </span>
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-950 block">
              Gold Elite (10%)
            </span>
            <div className="text-xl sm:text-3xl font-black mt-0.5">117 users</div>
          </div>
        </div>
      </div>

      {/* Earning Rules Settings Box */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Earning Rules</h3>
              <p className="text-xs text-slate-500">Global multiplier applied on every completed order</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
              Points per $1 Spent
            </label>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                value={rules.pointsPerDollar} 
                onChange={(e) => setRules({ ...rules, pointsPerDollar: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-28 px-4 py-2.5 rounded-xl bg-white border border-slate-300 font-black text-lg text-slate-900 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 outline-none"
              />
              <span className="text-xs font-bold text-slate-500">
                1 point = $0.05 reward value
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-center">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
              Example Order
            </span>
            <p className="text-sm font-semibold text-slate-700">
              A <strong className="text-slate-900">$50 order</strong> will instantly grant <strong className="text-red-600 font-black">{50 * rules.pointsPerDollar} points</strong> to the customer profile.
            </p>
          </div>
        </div>
      </div>

      {/* Tier Benefits (Auto-Applied) - Strict 2x2 on Mobile, 3 cols on Desktop */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900">Tier Benefits (Auto-Applied)</h3>
            <p className="text-xs sm:text-sm text-slate-500">Customer tier activates instantly when lifetime points surpass threshold.</p>
          </div>
        </div>

        {/* Cards Grid: 2x2 on Mobile (with third spanning or 2-col wrap), 3-col on sm/desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
          {rules.tiers.map((tier, index) => (
            <div 
              key={index} 
              className={cn(
                "relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border flex flex-col justify-between overflow-hidden bg-gradient-to-br transition-all hover:scale-[1.01] min-h-[190px] sm:min-h-[220px]",
                tier.gradient,
                index === 2 ? "col-span-2 sm:col-span-1" : ""
              )}
            >
              {/* Top Row */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <span className={cn(
                    "text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl backdrop-blur-md border inline-block",
                    tier.accent
                  )}>
                    {tier.badge}
                  </span>
                  <h4 className="font-black text-lg sm:text-2xl mt-2 tracking-tight">
                    {tier.name}
                  </h4>
                </div>

                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                  {index === 0 && <Shield className="w-4 h-4 sm:w-5 sm:h-5" />}
                  {index === 1 && <Award className="w-4 h-4 sm:w-5 sm:h-5" />}
                  {index === 2 && <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-950" />}
                </div>
              </div>

              {/* Threshold */}
              <div className="py-2 border-y border-white/15 my-2">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-75 block">
                  Required Points
                </span>
                <span className="text-xs sm:text-sm font-black">
                  {tier.min} – {tier.max === Infinity ? "Unlimited" : `${tier.max} pts`}
                </span>
              </div>

              {/* Benefit Perk */}
              <div>
                <span className="text-[9px] uppercase font-extrabold tracking-wider opacity-75 block">
                  Checkout Benefit
                </span>
                <span className="text-xs sm:text-sm font-extrabold line-clamp-2">
                  {tier.benefit}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-900 text-xs sm:text-sm flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="font-medium">
            Tier discounts are evaluated automatically at checkout. Logged-in customers receive their tier perks with zero coupon codes required.
          </p>
        </div>
      </div>

      {/* Redemption Vouchers - Strict 2x2 Grid on Mobile */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900">Redemption Vouchers</h3>
            <p className="text-xs sm:text-sm text-slate-500">Live rewards available in customer reward wallet</p>
          </div>
          <button 
            onClick={() => alert("Add voucher modal")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 transition-colors min-h-[36px]"
          >
            <Plus className="w-3.5 h-3.5" /> Add Reward
          </button>
        </div>

        {/* 2x2 Mobile Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {rules.redemptionOptions.map((opt, i) => (
            <div 
              key={i} 
              className={cn(
                "relative rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xl border border-white/10 flex flex-col justify-between overflow-hidden bg-gradient-to-br text-white min-h-[160px]",
                opt.gradient
              )}
            >
              <div className="flex items-start justify-between gap-1 mb-2">
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Gift className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-white/20 backdrop-blur-md border border-white/20">
                  {opt.points} pts
                </span>
              </div>

              <div>
                <h5 className="font-extrabold text-xs sm:text-sm text-white line-clamp-2 leading-tight">
                  {opt.reward}
                </h5>
                <p className="text-[11px] font-bold text-white/80 mt-1">
                  {opt.value}
                </p>
              </div>

              <div className="pt-2 border-t border-white/15 flex items-center justify-between mt-2">
                <span className="text-[9px] uppercase font-bold tracking-wider text-white/70">
                  Wallet Ready
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
