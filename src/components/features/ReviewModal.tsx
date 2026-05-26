"use client";

import { useState } from "react";
import { Star, X, MessageSquare, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

export function ReviewModal({ isOpen, onClose, orderId }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Future Supabase logic here
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white border border-gray-200 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {isSuccess ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-black mb-4 text-gray-900">Thank You!</h2>
                <p className="text-gray-600 mb-8">Your feedback helps us improve Spice Grille for everyone.</p>
                <button 
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl bg-red-600 text-white font-extrabold text-lg"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="p-8 md:p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900">Rate Your Order</h2>
                      <p className="text-xs text-gray-600 font-bold">{orderId}</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                    <X className="w-5 h-5 text-red-600" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="text-center">
                    <p className="text-sm font-bold mb-4 uppercase tracking-widest text-gray-600">How was the food?</p>
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setRating(star)}
                          className="p-1 transition-transform active:scale-90"
                        >
                          <Star 
                            className={cn(
                              "w-10 h-10 transition-colors",
                              (hoveredRating || rating) >= star 
                                ? "fill-red-600 text-red-600" 
                                : "text-red-200 stroke-[2.5px]"
                            )} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1 text-gray-900">Comments (Optional)</label>
                    <textarea 
                      placeholder="Share your experience..."
                      className="w-full px-6 py-4 rounded-2xl bg-red-50 border border-gray-300 focus:border-red-600 focus:bg-white transition-all outline-none min-h-[120px] resize-none"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>

                  <button 
                    disabled={rating === 0 || isSubmitting}
                    className="w-full py-5 rounded-2xl bg-red-600 text-white font-black text-xl shadow-lg shadow-red-500/20 hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
