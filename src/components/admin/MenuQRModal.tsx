"use client";

import MenuQRCode from "@/components/menu/QRCode";
import { X } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

interface MenuQRModalProps {
  menuUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MenuQRModal({ menuUrl, isOpen, onClose }: MenuQRModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Menu QR Code</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <MenuQRCode value={menuUrl} size={200} />
            <p className="mt-4 text-center text-gray-600 text-sm break-all">
              {menuUrl}
            </p>
            <p className="mt-2 text-center text-gray-500 text-xs">
              Customers can scan this code to view the live menu and earn points
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


