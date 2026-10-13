"use client";

import { useEffect, useState } from "react";
import { 
  Star, 
  CheckCircle2, 
  XCircle, 
  Trash2,
  Eye,
  EyeOff,
  Filter,
  RefreshCw,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const [filter, setFilter] = useState<"all" | "published" | "pending">("all");
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleTogglePublished = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setActionId(id);

    // Optimistic update
    setReviews(prev => prev.map(r => r.id === id ? { ...r, is_published: newStatus } : r));

    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_published: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      toast.success(newStatus ? "Review approved and published!" : "Review unpublished.");
    } catch (error: any) {
      // Revert on failure
      setReviews(prev => prev.map(r => r.id === id ? { ...r, is_published: currentStatus } : r));
      toast.error("Error updating review status");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    setActionId(id);
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete review");
      }

      setReviews(prev => prev.filter(r => r.id !== id));
      toast.success("Review deleted successfully");
    } catch (error: any) {
      toast.error("Error deleting review");
    } finally {
      setActionId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const filteredReviews = reviews.filter(r => {
    if (filter === "published") return r.is_published;
    if (filter === "pending") return !r.is_published;
    return true;
  });

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
    : "0.0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Customer Reviews</h1>
          <p className="text-sm text-slate-600 mt-1">Review feedback, moderate ratings, and publish authentic experiences.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white shadow-lg shadow-amber-950/20">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <Star className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-white leading-none block">{avgRating}</span>
              <span className="text-[10px] font-bold text-amber-100 uppercase tracking-wider">{reviews.length} total reviews</span>
            </div>
          </div>
          <button
            onClick={fetchReviews}
            className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm active:scale-95 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Refresh reviews"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[40px]",
            filter === "all" ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          )}
        >
          All ({reviews.length})
        </button>
        <button
          onClick={() => setFilter("published")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[40px]",
            filter === "published" ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          )}
        >
          Published ({reviews.filter(r => r.is_published).length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[40px]",
            filter === "pending" ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          )}
        >
          Pending ({reviews.filter(r => !r.is_published).length})
        </button>
      </div>

      {/* MOBILE STRICT 2x2 GRID */}
      <div className="md:hidden grid grid-cols-2 gap-2.5">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="p-4 bg-white rounded-2xl border border-slate-200 animate-pulse space-y-2.5">
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-12 bg-slate-100 rounded-xl" />
              <div className="h-8 bg-slate-200 rounded-xl" />
            </div>
          ))
        ) : filteredReviews.length === 0 ? (
          <div className="col-span-2 p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
            No reviews matching this filter
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review.id}
              className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden"
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm">
                    {review.profiles?.full_name?.[0]?.toUpperCase() || "A"}
                  </div>
                  <span className={cn(
                    "text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0",
                    review.is_published 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  )}>
                    {review.is_published ? "Live" : "Pending"}
                  </span>
                </div>

                <h4 className="font-extrabold text-xs text-slate-900 truncate mb-1">
                  {review.profiles?.full_name || "Guest"}
                </h4>

                {/* Stars */}
                <div className="flex items-center gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      className={cn("w-3 h-3", s <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200")} 
                    />
                  ))}
                </div>

                <p className="text-[11px] text-slate-600 line-clamp-3 italic bg-slate-50 p-2 rounded-xl mb-2.5">
                  &ldquo;{review.comment}&rdquo;
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                <button
                  onClick={() => handleTogglePublished(review.id, review.is_published)}
                  disabled={actionId === review.id}
                  className={cn(
                    "flex-1 min-h-[36px] px-2 rounded-xl text-[11px] font-black flex items-center justify-center transition-all active:scale-95 disabled:opacity-50",
                    review.is_published
                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                  )}
                >
                  {review.is_published ? "Unpublish" : "Approve"}
                </button>
                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={actionId === review.id}
                  className="min-h-[36px] min-w-[36px] rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 transition-all active:scale-95"
                  title="Delete review"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP REVIEWS GRID */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4.5">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded w-1/3" />
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-2/3" />
            </div>
          ))
        ) : filteredReviews.length === 0 ? (
          <div className="col-span-3 p-12 rounded-3xl bg-white border border-slate-200 shadow-sm text-center">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">No reviews found</h3>
            <p className="text-xs text-slate-500 mt-1">There are no customer ratings matching this filter.</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div 
              key={review.id} 
              className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm transition-all hover:border-slate-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0">
                      {review.profiles?.full_name?.[0]?.toUpperCase() || "A"}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                        {review.profiles?.full_name || "Guest Customer"}
                      </h3>
                      <p className="text-[10px] text-slate-400">{formatDate(review.created_at)}</p>
                    </div>
                  </div>

                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1",
                    review.is_published 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  )}>
                    {review.is_published ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <EyeOff className="w-3 h-3 text-amber-600" />}
                    {review.is_published ? "Live" : "Pending"}
                  </span>
                </div>

                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      className={cn("w-4 h-4", s <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200")} 
                    />
                  ))}
                  <span className="text-xs font-black text-slate-700 ml-1">{review.rating}.0</span>
                </div>

                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 italic mb-4">
                  &ldquo;{review.comment}&rdquo;
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleTogglePublished(review.id, review.is_published)}
                  disabled={actionId === review.id}
                  className={cn(
                    "min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50",
                    review.is_published
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                  )}
                >
                  {review.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{review.is_published ? "Unpublish" : "Publish"}</span>
                </button>

                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={actionId === review.id}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-black bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                  title="Delete review"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}