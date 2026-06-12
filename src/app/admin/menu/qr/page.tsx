"use client";

import { useState, useEffect } from "react";
import MenuQRCode from "@/components/menu/QRCode";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminMenuQR() {
  const [menuUrl, setMenuUrl] = useState("/menu/view");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const baseUrl = window.location.origin.replace(/\/admin.*$/, "");
      setMenuUrl(`${baseUrl}/menu/view`);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href="/admin/menu"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Menu
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-12 shadow-xl max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu QR Code</h1>
          <p className="text-gray-600 mb-8">
            Show this QR code to your customers. They can scan it to view your current menu and earn points.
          </p>
        
          <MenuQRCode value={menuUrl} size={250} />
        
          <div className="mt-8 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm font-medium text-gray-500 mb-2">Menu URL:</p>
            <p className="text-sm text-gray-900 break-all">{menuUrl}</p>
          </div>

          <div className="mt-8 space-y-4">
            <p className="text-sm text-gray-600">Customers scan to view your live menu</p>
            <p className="text-sm text-gray-600">They earn 10 points for viewing (once per day)</p>
            <p className="text-sm text-gray-600">They earn 5 points for sharing</p>
          </div>
        </div>
      </div>
    </div>
  );
}
