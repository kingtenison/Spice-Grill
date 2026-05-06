"use client";

import { Navbar } from "@/components/layout/Navbar";
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
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="container px-4 pt-24 pb-20 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Points Status */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-12 rounded-[3.5rem] bg-gray-50 text-gray-900 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
              
              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                  <h1 className="text-4xl md:text-5xl font-black mb-4">Your Spice Grill Rewards</h1>
                  <p className="text-gray-600 text-lg mb-8">You&apos;re making great progress towards Silver tier!</p>
                  
                  <div className="flex items-end gap-3 mb-4">
                     <span className="text-6xl font-black text-red-600">{userPoints}</span>
                     <span className="text-xl font-bold mb-2 opacity-50">Points</span>
                   </div>

                  <div className="w-full max-w-md h-3 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-red-500"
                    />
                  </div>
                  <p className="text-sm font-bold mt-4 opacity-60">150 points until Silver Status</p>
                </div>

                <div className="w-40 h-40 rounded-[2.5rem] bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                  <Trophy className="w-20 h-20 text-red-500" />
                </div>
              </div>
            </motion.div>

            {/* Tiers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TIERS.map((tier) => (
                <div key={tier.name} className={cn(
                  "p-8 rounded-[2.5rem] bg-white border border-gray-200 flex flex-col relative overflow-hidden",
                  tier.current && "border-red-500 ring-2 ring-red-500/20"
                )}>
                  {tier.current && (
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-widest">
                      Current
                    </div>
                  )}
                  <h3 className="text-2xl font-black mb-1 text-gray-900">{tier.name}</h3>
                  <p className="text-xs font-bold text-gray-600 uppercase mb-6">{tier.range}</p>
                  
                  <ul className="space-y-4 mb-8 flex-grow">
                    {tier.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm font-medium text-gray-800">
                        <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        {benefit}
                      </li>
                    ))}
                  </ul>

                  {!tier.current && (
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                      <Lock className="w-3 h-3" /> Locked
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Rewards Marketplace */}
          <div className="space-y-8">
            <h2 className="text-2xl font-black text-gray-900">Available Rewards</h2>
            <div className="space-y-4">
              {[
                { name: "Free Truffle Fries", points: 200, icon: Gift },
                { name: "$10 Discount", points: 500, icon: Star },
                { name: "Signature Cocktail", points: 350, icon: Gift },
              ].map((reward, i) => (
                <div key={i} className="p-6 rounded-[2rem] bg-white border border-gray-200 flex items-center justify-between group hover:border-red-500/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-red-500/10 transition-all">
                      <reward.icon className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{reward.name}</h4>
                      <p className="text-xs text-gray-600 font-medium">{reward.points} Points</p>
                    </div>
                  </div>
                  <button className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    userPoints >= reward.points 
                      ? "bg-red-500 text-white hover:scale-105" 
                      : "bg-gray-50 text-gray-500 cursor-not-allowed"
                  )}>
                    Redeem
                  </button>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="p-8 rounded-[2.5rem] bg-gray-50/50 border border-gray-200">
              <h3 className="font-bold mb-4 text-gray-900">How it works</h3>
              <div className="space-y-6">
                {[
                  { step: "1", text: "Order your favorite dishes" },
                  { step: "2", text: "Earn 1 point for every $1 spent" },
                  { step: "3", text: "Redeem points for delicious rewards" },
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center font-black text-xs">
                      {s.step}
                    </div>
                    <p className="text-sm font-medium text-gray-600">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
