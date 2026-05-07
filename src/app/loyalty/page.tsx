"use client";

import {
  Trophy,
  Gift,
  Star,
  CheckCircle2,
  Lock
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const TIERS = [
  { 
    name: "Bronze", 
    range: "0 - 500 pts", 
    benefits: ["5% off every 10th order", "Birthday surprise"], 
    current: true,
    color: "bg-orange-100 text-orange-700"
  },
  { 
    name: "Silver", 
    range: "501 - 2000 pts", 
    benefits: ["10% off every 5th order", "Free delivery", "Exclusive items"], 
    current: false,
    color: "bg-slate-100 text-slate-700"
  },
  { 
    name: "Gold", 
    range: "2001+ pts", 
    benefits: ["15% off ALL orders", "Priority preparation", "Chef's table invites"], 
    current: false,
    color: "bg-yellow-100 text-yellow-700"
  }
];

export default function LoyaltyPage() {
  const userPoints = 350;
  const nextTierPoints = 500;
  const progress = (userPoints / nextTierPoints) * 100;

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <main className="container px-4 pt-20 pb-24 mx-auto lg:pl-sidebar grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[3.5rem] bg-gray-50 text-gray-900 relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-red-500/20 blur-[80px] sm:blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
            
            <div className="relative flex flex-col gap-4 sm:gap-6">
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2 sm:mb-4">Your Spice Grill Rewards</h1>
                <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">You&apos;re making great progress towards Silver tier!</p>
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
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-red-500"
                    />
                  </div>
                  <p className="text-xs sm:text-sm font-bold mt-2 sm:mt-4 opacity-60">150 points until Silver Status</p>
                </div>

                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[1.5rem] sm:rounded-[2.5rem] bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto sm:mx-0">
                  <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-red-500" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tiers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {TIERS.map((tier) => (
              <div key={tier.name} className={cn(
                "p-5 sm:p-6 rounded-[2rem] bg-white border border-gray-200 flex flex-col relative overflow-hidden",
                tier.current && "border-red-500 ring-2 ring-red-500/20"
              )}>
                {tier.current && (
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

                {!tier.current && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Rewards Marketplace */}
        <div className="space-y-6 sm:space-y-8">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">Available Rewards</h2>
          <div className="space-y-3 sm:space-y-4">
            {[
              { name: "Free Truffle Fries", points: 200, icon: Gift },
              { name: "$10 Discount", points: 500, icon: Star },
              { name: "Signature Cocktail", points: 350, icon: Gift },
            ].map((reward, i) => (
              <div key={i} className="p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-white border border-gray-200 flex items-center justify-between group hover:border-red-500/30 transition-all cursor-pointer">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-red-500/10 transition-all">
                    <reward.icon className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm sm:text-base">{reward.name}</h4>
                    <p className="text-xs text-gray-600 font-medium">{reward.points} Points</p>
                  </div>
                </div>
                <button className={cn(
                  "px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all",
                  userPoints >= reward.points 
                    ? "bg-red-500 text-white hover:scale-105" 
                    : "bg-gray-50 text-gray-500 cursor-not-allowed"
                )}>
                  Redeem
                </button>
              </div>
            ))}
          </div>

          <div className="p-5 sm:p-6 rounded-[2rem] bg-gray-50/50 border border-gray-200">
            <h3 className="font-bold mb-3 sm:mb-4 text-gray-900 text-sm sm:text-base">How it works</h3>
            <div className="space-y-4 sm:space-y-6">
              {[
                { step: "1", text: "Order your favorite dishes" },
                { step: "2", text: "Earn 1 point for every $1 spent" },
                { step: "3", text: "Redeem points for delicious rewards" },
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
        </div>
      </main>
    </div>
  );
}