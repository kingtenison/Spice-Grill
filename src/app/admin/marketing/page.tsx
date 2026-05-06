"use client";

import { useEffect, useState } from "react";
import { 
  Megaphone, 
  Tag, 
  Plus,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  reach: string;
  performance: string;
}

interface NewCampaignForm {
  name: string;
  type: string;
  status: string;
  reach: string;
  performance: string;
}

export default function AdminMarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<NewCampaignForm>({
    name: "",
    type: "Discount",
    status: "draft",
    reach: "",
    performance: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/campaigns");
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns([data.campaign, ...campaigns]);
        setShowModal(false);
        setFormData({ name: "", type: "Discount", status: "draft", reach: "", performance: "" });
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const CAMPAIGN_TYPES = ["Discount", "Offer", "Announcement"];

   return (
     <div className="space-y-8">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
           <h1 className="text-3xl font-extrabold mb-1 text-gray-900">Marketing & Growth</h1>
           <p className="text-gray-600">Run campaigns, manage discounts, and automate retention.</p>
         </div>
         <button 
           onClick={() => setShowModal(true)}
           className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-bold shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all"
         >
           <Plus className="w-5 h-5" /> New Campaign
         </button>
       </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="p-8 rounded-[2.5rem] bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Loyalty Rules</h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-600 ml-1">Points per $1 spent</label>
                  <div className="flex items-center gap-3">
                    <input type="number" defaultValue="1" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-bold text-gray-900" />
                    <span className="text-sm font-bold text-gray-600">pts</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-600 ml-1">Signup Bonus</label>
                  <div className="flex items-center gap-3">
                    <input type="number" defaultValue="50" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-bold text-gray-900" />
                    <span className="text-sm font-bold text-gray-600">pts</span>
                  </div>
                </div>
                <button className="w-full py-3 rounded-xl bg-gray-50 text-gray-900 font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                  <Settings className="w-4 h-4" /> Update Rules
                </button>
              </div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-red-600 text-white shadow-lg shadow-red-500/20">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6" />
                <h4 className="font-black text-lg">Active Members</h4>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black">1,842</span>
                <span className="text-sm font-bold opacity-60 mb-1">+12 today</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Active Campaigns</h2>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold hover:bg-gray-50 transition-all">All</button>
                <button className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold hover:bg-gray-50 transition-all">Active</button>
                <button className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold hover:bg-gray-50 transition-all">Completed</button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : campaigns.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white border border-gray-200 text-center text-gray-500">
                  No campaigns yet. Create your first campaign!
                </div>
              ) : (
                campaigns.map((campaign) => (
                  <div key={campaign.id} className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:border-red-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-all">
                        {campaign.type === "Discount" ? <Tag className="w-6 h-6 text-red-600" /> : <Megaphone className="w-6 h-6 text-red-600" />}
                      </div>
                      <div>
                        <h4 className="font-black text-lg group-hover:text-red-600 transition-colors text-gray-900">{campaign.name}</h4>
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-600 uppercase mt-1">
                          <span>{campaign.type}</span>
                          <div className="w-1 h-1 rounded-full bg-gray-300" />
                          <span>{campaign.reach}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-600 mb-1">Performance</p>
                        <p className="text-sm font-bold text-gray-900">{campaign.performance || "-"}</p>
                      </div>
                      <div className={cn(
                        "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase",
                        campaign.status === "active" ? "bg-green-100 text-green-600" : 
                        campaign.status === "draft" ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                      )}>
                        {campaign.status}
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 rounded-lg hover:bg-gray-100 transition-all"><Settings className="w-4 h-4 text-gray-600" /></button>
                        <button className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 p-10 rounded-[3rem] bg-gray-50 text-gray-900 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-red-100 blur-[80px] rounded-full translate-x-1/2 translate-y-1/2" />
              <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="w-20 h-20 rounded-3xl bg-red-600 flex items-center justify-center shrink-0 shadow-xl shadow-red-500/30">
                  <Send className="w-10 h-10 text-white" />
                </div>
                <div className="flex-grow">
                  <h3 className="text-2xl font-black mb-2 text-gray-900">Automated Notifications</h3>
                  <p className="text-gray-600 font-medium">Send automatic SMS and Email alerts when customers hit new milestones or leave their carts.</p>
                </div>
                <button className="px-8 py-4 rounded-2xl bg-white text-gray-900 font-extrabold hover:scale-105 transition-transform whitespace-nowrap border border-gray-200">
                  Manage Triggers
                </button>
              </div>
            </div>
          </div>
        </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create New Campaign</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-red-50">
                <X className="w-5 h-5 text-red-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Campaign Name</label>
                <input
                  type="text" required value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-bold text-gray-900"
                >
                  {CAMPAIGN_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-bold text-gray-900"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-bold disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const Trophy = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" />;
const Users = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" />;
const Settings = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" />;
const Send = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" />;
const Trash2 = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" />;