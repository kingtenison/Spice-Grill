"use client";

import { useEffect, useState } from "react";
import { 
  Star, 
  CheckCircle2, 
  XCircle, 
  MoreVertical
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  comment: string;
  is_published: boolean;
  created_at: string;
  profiles: { full_name: string };
}

export default function AdminReviewsPage() {
   const [reviews, setReviews] = useState<Review[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/reviews");
        const data = await res.json();
        setReviews(data.reviews || []);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold mb-1 text-gray-900">Customer Reviews</h1>
          <p className="text-gray-600">Monitor and moderate feedback from your customers.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-red-500 font-black text-2xl">
            <Star className="w-8 h-8 fill-red-500" />
            {loading ? "—" : reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0.0"}
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase">Average Rating</p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-8 rounded-[2.5rem] bg-white border border-gray-200 shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-8 rounded-[2.5rem] bg-white border border-gray-200 shadow-sm text-center text-gray-500">
            No reviews found
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="p-8 rounded-[2.5rem] bg-white border border-gray-200 shadow-sm group">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 shrink-0 flex items-center justify-center">
                    <span className="text-xl font-black text-red-500">{review.profiles?.full_name?.[0] || "—"}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-black text-gray-900">{review.profiles?.full_name || "Anonymous"}</h3>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{formatDate(review.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cn("w-4 h-4", s <= review.rating ? "fill-red-500 text-red-500" : "text-gray-300")} />
                      ))}
                    </div>
                    <p className="text-gray-600 leading-relaxed py-2 italic">&quot;{review.comment}&quot;</p>
                  </div>
                </div>

                <div className="flex md:flex-col items-center gap-2">
                  <div className={cn(
                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase mb-4",
                    review.is_published ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                  )}>
                    {review.is_published ? "Published" : "Pending"}
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-3 rounded-xl bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm" title="Approve">
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <button className="p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Reject">
                      <XCircle className="w-5 h-5" />
                    </button>
                    <button className="p-3 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-900 hover:text-white transition-all">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}