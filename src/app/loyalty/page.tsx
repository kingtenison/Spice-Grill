"use client";

import { useState, useEffect } from "react";
import {
  Trophy,
  Gift,
  Star,
  CheckCircle2,
  Lock,
  Copy,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type LoyaltyData = {
  points: number;
  tier: string;
  nextTier: string;
  nextTierPoints: number;
  progress: number;
  pointsToNext: number;
};

type Reward = {
  key: string;
  name: string;
  points: number;
  icon: any;
  description: string;
};

const TIERS = [
  { 
    name: "Bronze", 
    range: "0 - 500 pts", 
    benefits: ["5% off every 10th order", "Birthday surprise"], 
    color: "bg-orange-100 text-orange-700"
  },
  { 
    name: "Silver", 
    range: "501 - 2000 pts", 
    benefits: ["10% off every 5th order", "Free delivery", "Exclusive items"], 
    color: "bg-slate-100 text-slate-700"
  },
  { 
    name: "Gold", 
    range: "2001+ pts", 
    benefits: ["15% off ALL orders", "Priority preparation", "Chef's table invites"], 
    color: "bg-yellow-100 text-yellow-700"
  }
];

const AVAILABLE_REWARDS: Reward[] = [
  { key: "fries", name: "Free Truffle Fries", points: 200, icon: Gift, description: "Free Truffle Fries with any purchase" },
  { key: "cocktail", name: "Signature Cocktail", points: 350, icon: Gift, description: "One free signature cocktail" },
  { key: "discount10", name: "$10 Discount", points: 500, icon: Star, description: "$10 off your next order" },
];

export default function LoyaltyPage() {
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [redeemedReward, setRedeemedReward] = useState<{ code: string; name: string; points: number } | null>(null);
  const [error, setError] = useState("");

  const fetchLoyalty = async () => {
    try {
      const res = await fetch("/api/loyalty");
      if (res.ok) {
        const data = await res.json();
        setLoyalty(data);
      } else if (res.status === 401) {
        // Not logged in - show demo state
        setLoyalty({
          points: 0,
          tier: "Bronze",
          nextTier: "Silver",
          nextTierPoints: 501,
          progress: 0,
          pointsToNext: 501,
        });
      }
    } catch (e) {
      console.error("Failed to fetch loyalty:", e);
      setLoyalty({
        points: 0,
        tier: "Bronze",
        nextTier: "Silver",
        nextTierPoints: 501,
        progress: 0,
        pointsToNext: 501,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoyalty();
  }, []);

  const handleRedeem = async (reward: Reward) => {
    if (!loyalty || loyalty.points < reward.points) return;

    setRedeeming(reward.key);
    setError("");

    try {
      const res = await fetch("/api/loyalty/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardKey: reward.key }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to redeem reward");
        return;
      }

      // Success - show modal with code
      setRedeemedReward({
        code: data.code,
        name: reward.name,
        points: reward.points,
      });
      setShowSuccess(true);

      // Refresh loyalty data
      await fetchLoyalty();
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setRedeeming(null);
    }
  };

  const copyCode = async () => {
    if (!redeemedReward) return;
    await navigator.clipboard.writeText(redeemedReward.code);
  };

  const closeSuccess = () => {
    setShowSuccess(false);
    setRedeemedReward(null);
    setError("");
  };

  const currentTier = loyalty?.tier || "Bronze";
  const userPoints = loyalty?.points ?? 0;
  const progress = loyalty?.progress ?? 0;
  const pointsToNext = loyalty?.pointsToNext ?? 501;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <main className="container px-4 pt-20 pb-24 mx-auto lg:pl-sidebar grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Hero Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[3.5rem] bg-gray-50 text-gray-900 relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-red-500/20 blur-[80px] sm:blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
            
            <div className="relative flex flex-col gap-4 sm:gap-6">
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2 sm:mb-4">Your Spice Grille Rewards</h1>
                <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
                  {loyalty && loyalty.pointsToNext > 0 
                    ? `You're ${loyalty.pointsToNext} points away from ${loyalty.nextTier}!` 
                    : "You're at the top tier!"}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-8">
                <div className="text-center sm:text-left">
                  <div className="flex items-end justify-center sm:justify-start gap-2 mb-2 sm:mb-4">
                    <span className="text-4xl sm:text-5xl font-black text-red-600">{userPoints}</span>
                    <span className="text-lg sm:text-xl font-bold mb-1 opacity-50">Points</span>
                  </div>
                  
                  <div className="w-full max-w-xs h-2.5 sm:h-3 bg-gray-200 rounded-full overflow-hidden mx-auto sm:mx-0">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="h-full bg-red-500"
                    />
                  </div>
                  <p className="text-xs sm:text-sm font-bold mt-2 sm:mt-4 opacity-60">
                    {pointsToNext > 0 ? `${pointsToNext} points until ${loyalty?.nextTier} Status` : "Max tier achieved"}
                  </p>
                  <div className="mt-1 text-xs font-bold text-red-600">{currentTier} MEMBER</div>
                </div>

                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[1.5rem] sm:rounded-[2.5rem] bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto sm:mx-0">
                  <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-red-500" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tiers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {TIERS.map((tier) => {
              const isCurrent = tier.name === currentTier;
              const isUnlocked = 
                (tier.name === "Bronze") || 
                (tier.name === "Silver" && userPoints >= 501) || 
                (tier.name === "Gold" && userPoints >= 2001);

              return (
                <div key={tier.name} className={cn(
                  "p-5 sm:p-6 rounded-[2rem] bg-white border border-gray-200 flex flex-col relative overflow-hidden",
                  isCurrent && "border-red-500 ring-2 ring-red-500/20"
                )}>
                  {isCurrent && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-widest">
                      Current
                    </div>
                  )}
                  <h3 className="text-xl sm:text-2xl font-black mb-1 text-gray-900">{tier.name}</h3>
                  <p className="text-xs font-bold text-gray-600 uppercase mb-4 sm:mb-6">{tier.range}</p>
                  
                  <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 flex-grow">
                    {tier.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm font-medium text-gray-800">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 shrink-0 mt-0.5" />
                        {benefit}
                      </li>
                    ))}
                  </ul>

                  {!isUnlocked && !isCurrent && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Rewards Marketplace */}
        <div className="space-y-6 sm:space-y-8">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">Available Rewards</h2>
          
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            {AVAILABLE_REWARDS.map((reward) => {
              const canRedeem = userPoints >= reward.points;
              const Icon = reward.icon;
              const isRedeeming = redeeming === reward.key;

              return (
                <div 
                  key={reward.key} 
                  className="p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-white border border-gray-200 flex items-center justify-between group hover:border-red-500/30 transition-all"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-red-500/10 transition-all">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">{reward.name}</h4>
                      <p className="text-xs text-gray-600 font-medium">{reward.points} Points • {reward.description}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRedeem(reward)}
                    disabled={!canRedeem || isRedeeming}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      canRedeem 
                        ? "bg-red-500 text-white hover:bg-red-600 active:scale-[0.985]" 
                        : "bg-gray-100 text-gray-400 cursor-not-allowed",
                      isRedeeming && "opacity-75"
                    )}
                  >
                    {isRedeeming ? "..." : canRedeem ? "Redeem" : "Locked"}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="p-5 sm:p-6 rounded-[2rem] bg-gray-50/50 border border-gray-200">
            <h3 className="font-bold mb-3 sm:mb-4 text-gray-900 text-sm sm:text-base">How it works</h3>
            <div className="space-y-4 sm:space-y-6">
              {[
                { step: "1", text: "Order your favorite dishes" },
                { step: "2", text: "Earn 1 point for every $1 spent" },
                { step: "3", text: "Redeem points for delicious rewards" },
                { step: "4", text: "Enter your reward code at checkout" },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-2.5 sm:gap-4">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center font-black text-[10px] sm:text-xs">
                    {s.step}
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{s.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* My Active Reward Codes */}
          {loyalty && (loyalty as any).unusedCoupons?.length > 0 && (
            <div className="mt-8">
              <h3 className="font-bold text-lg mb-4 text-gray-900">Your Active Reward Codes</h3>
              <div className="space-y-3">
                {(loyalty as any).unusedCoupons.map((c: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4">
                    <div>
                      <div className="font-mono text-red-600 font-black tracking-widest text-lg">{c.code}</div>
                      <div className="text-sm text-gray-600">{c.description} — {c.discount_type === 'fixed' ? '$' : ''}{c.discount_value}{c.discount_type === 'percentage' ? '%' : ''} off</div>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(c.code)}
                      className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-300 hover:bg-gray-50 flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && redeemedReward && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative"
            >
              <button onClick={closeSuccess} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9 text-green-600" />
                </div>

                <h3 className="text-2xl font-black mb-2">Reward Redeemed!</h3>
                <p className="text-gray-600 mb-6">
                  {redeemedReward.name} • {redeemedReward.points} points used
                </p>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
                  <div className="text-xs font-bold text-gray-500 tracking-widest mb-2">YOUR REWARD CODE</div>
                  <div className="font-mono text-3xl font-black tracking-[4px] text-red-600 mb-4">
                    {redeemedReward.code}
                  </div>
                  <button
                    onClick={copyCode}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-white border border-gray-300 text-sm font-bold hover:bg-gray-50 active:scale-[0.985] transition-all"
                  >
                    <Copy className="w-4 h-4" /> Copy Code
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-6">
                  Enter this code at checkout to apply your discount. Valid for 90 days.
                </p>

                <button
                  onClick={closeSuccess}
                  className="w-full py-3.5 rounded-2xl bg-red-600 text-white font-bold text-lg hover:bg-red-700 transition-colors"
                >
                  Awesome!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
