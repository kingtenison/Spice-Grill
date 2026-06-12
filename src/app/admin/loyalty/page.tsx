"use client";

import { useState } from "react";
import { Award, Save, Info } from "lucide-react";

const DEFAULT_RULES = {
  pointsPerDollar: 1,
  tiers: [
    { name: "Bronze", min: 0, max: 500, benefit: "0% discount" },
    { name: "Silver", min: 501, max: 2000, benefit: "5% automatic discount at checkout" },
    { name: "Gold", min: 2001, max: Infinity, benefit: "10% automatic discount + priority prep" },
  ],
  redemptionOptions: [
    { points: 200, reward: "$8.99 value (Free Truffle Fries)" },
    { points: 350, reward: "Signature Cocktail (~$12 value)" },
    { points: 500, reward: "$10 off order" },
  ]
};

export default function AdminLoyaltyPage() {
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    // In production: save to a loyalty_settings table or Supabase config
    setTimeout(() => {
      alert("Loyalty rules saved! (Demo - would persist in production)");
      setSaving(false);
    }, 600);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Loyalty Program Rules</h1>
        <p className="text-gray-600">Configure how customers earn and redeem points. Tier benefits are automatically applied at checkout.</p>
      </div>

      <div className="bg-white rounded-2xl border p-8">
        <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
          <Award className="text-red-600" /> Earning Rules
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Points per $1 spent</label>
            <input 
              type="number" 
              value={rules.pointsPerDollar} 
              onChange={e => setRules({...rules, pointsPerDollar: parseInt(e.target.value)})}
              className="w-32 border rounded-xl px-4 py-3 text-lg font-bold"
            />
            <p className="text-xs text-gray-500 mt-1">Currently: 1 point per dollar spent on every order.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-8">
        <h3 className="font-bold text-xl mb-6">Tier Benefits (Auto-Applied)</h3>
        
        <div className="space-y-4">
          {rules.tiers.map((tier, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-2xl">
              <div>
                <div className="font-black text-xl">{tier.name}</div>
                <div className="text-sm text-gray-600">{tier.min} – {tier.max === Infinity ? '∞' : tier.max} points</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">{tier.benefit}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-2xl text-sm flex gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>Tier discounts are automatically calculated and applied during checkout for logged-in users based on their current loyalty_points.tier.</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-8">
        <h3 className="font-bold text-xl mb-6">Redemption Options (Current)</h3>
        <div className="space-y-3">
          {rules.redemptionOptions.map((opt, i) => (
            <div key={i} className="flex justify-between p-4 bg-gray-50 rounded-2xl">
              <div>{opt.reward}</div>
              <div className="font-bold text-red-600">{opt.points} pts</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-4">Redemption options are currently managed in the /loyalty page and redeem API. Edit there for now.</p>
      </div>

      <button 
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-8 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 disabled:opacity-60"
      >
        <Save className="w-5 h-5" /> {saving ? "Saving Rules..." : "Save Loyalty Configuration"}
      </button>
    </div>
  );
}
