"use client";

import { useState, useEffect } from "react";
import { CreditCard, Save, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function DispatcherPaymentSettingsPage() {
  const [dispatcherId, setDispatcherId] = useState<string | null>(null);
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccount, setConfirmAccount] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem("dispatcher_id");
    if (!id) {
      window.location.href = "/dispatcher";
      return;
    }
    setDispatcherId(id);

    // Load existing bank details
    const loadBankDetails = async () => {
      try {
        const res = await fetch(`/api/dispatcher/bank-account?dispatcher_id=${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setRoutingNumber(data.routing_number || "");
            setLastFour(data.account_last_four || "");
            setIsSaved(true);
          }
        }
      } catch (e) {
        console.error("Failed to load bank details:", e);
      } finally {
        setLoading(false);
      }
    };
    loadBankDetails();
  }, []);

  const handleSave = async () => {
    setError("");

    if (!routingNumber.trim() || routingNumber.length < 9) {
      setError("Please enter a valid 9-digit routing number");
      return;
    }
    if (!accountNumber.trim() || accountNumber.length < 8) {
      setError("Please enter a valid account number");
      return;
    }
    if (accountNumber !== confirmAccount) {
      setError("Account numbers do not match");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/dispatcher/bank-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dispatcher_id: dispatcherId,
          routing_number: routingNumber,
          account_number: accountNumber,
        }),
      });

      if (res.ok) {
        setLastFour(accountNumber.slice(-4));
        setAccountNumber("");
        setConfirmAccount("");
        setIsSaved(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save bank details");
      }
    } catch (e) {
      setError("Failed to save bank details");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container px-4 pt-24 pb-12 mx-auto max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dispatcher" className="p-2 rounded-lg bg-white border border-gray-200 hover:border-red-600 hover:text-red-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Payment Settings</h1>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">Bank Account Details</h2>
          </div>

          {isSaved && lastFour && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Bank account ending in ****{lastFour} is on file</p>
                <p className="text-sm text-green-600">Update below to change your bank details</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Routing Number *</label>
              <input
                type="text"
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-colors text-gray-900"
                placeholder="123456789"
              />
              <p className="text-xs text-gray-500 mt-1">9-digit routing number</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Number *</label>
              <input
                type="password"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 17))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-colors text-gray-900"
                placeholder="Enter account number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Account Number *</label>
              <input
                type="password"
                value={confirmAccount}
                onChange={(e) => setConfirmAccount(e.target.value.replace(/\D/g, "").slice(0, 17))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-colors text-gray-900"
                placeholder="Confirm account number"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-3 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Bank Details"}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Your bank details are encrypted and stored securely. Used only for receiving delivery earnings.
          </p>
        </div>
      </main>
    </div>
  );
}
