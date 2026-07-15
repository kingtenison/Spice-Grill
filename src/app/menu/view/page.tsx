"use client";

import { useState, useEffect, useCallback } from "react";
import { createAuthClientBrowser } from "@/lib/supabase/client";
import { useCartStore } from "@/store/useCartStore";
import { Share } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  categories?: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

export default function MenuView() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pointsAwardedToday, setPointsAwardedToday] = useState(false);
  const { addItem } = useCartStore();
  const supabase = createAuthClientBrowser();

  const fetchMenu = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: menuError } = await supabase
        .from("menu_items")
        .select(`*, categories(name)`);

      if (menuError) throw menuError;
      setMenuItems(data || []);
    } catch (err: any) {
      console.error("Failed to fetch menu:", err);
      setError(err.message || "Failed to load menu");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const getStorage = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
  const setStorage = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch {} };

  const awardViewPoints = useCallback(async () => {
    try {
      const lastViewDate = getStorage("menuViewDate");
      const today = new Date().toDateString();
      if (lastViewDate === today) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.rpc("award_loyalty_points", {
        p_user_id: user.id,
        p_points: 10,
      });

      if (error) throw error;
      setStorage("menuViewDate", today);
      setPointsAwardedToday(true);
    } catch (err) {
      console.error("Failed to award view points:", err);
    }
  }, [supabase]);

  const awardSharePoints = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.rpc("award_loyalty_points", {
        p_user_id: user.id,
        p_points: 5,
      });

      if (error) throw error;
      console.log("Share points awarded!");
    } catch (err) {
      console.error("Failed to award share points:", err);
    }
  }, [supabase]);

  const handleShare = useCallback(async () => {
    try {
      await awardSharePoints();
      if (navigator.share) {
        await navigator.share({
          title: "Spice Grille Menu",
          text: "Check out the live menu at Spice Grille!",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Menu link copied to clipboard!");
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  }, [awardSharePoints]);

  useEffect(() => {
    fetchMenu();

    const subscription = supabase
      .channel("menu-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, () => {
        fetchMenu();
      })
      .subscribe();

    awardViewPoints();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchMenu, awardViewPoints]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-gray-500">Loading menu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  const groupedItems: Record<string, MenuItem[]> = {};
  menuItems.forEach((item) => {
    const categoryName = item.categories?.name || "Uncategorized";
    if (!groupedItems[categoryName]) groupedItems[categoryName] = [];
    groupedItems[categoryName].push(item);
  });

  const sortedCategoryNames = Object.keys(groupedItems).sort();

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200 pb-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center">
            <img src="/Spice_Logo.jpg" alt="Spice Grille" className="h-16 w-auto mb-4" />
            <h1 className="text-3xl font-bold text-center text-red-600">Spice Grille</h1>
            <p className="text-center text-gray-600">Todays Menu - Scan to view & earn points</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {pointsAwardedToday && (
          <div className="mb-6 flex items-center justify-center bg-green-50 border-l-4 border-green-400 p-4">
            <span>Youve earned 10 points for viewing the menu today!</span>
          </div>
        )}

        <div className="space-y-8">
          {sortedCategoryNames.map((categoryName, index) => (
            <div key={index} className="space-y-4">
              <h2 className="text-2xl font-semibold text-red-700 border-b-2 border-red-200 pb-2">
                {categoryName}
              </h2>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groupedItems[categoryName].map((item) => (
                  <div key={item.id} className="group bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 italic">No Image</span>
                      </div>
                    )}

                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">{item.description}</p>
                      <p className="font-bold text-red-600">${item.price.toFixed(2)}</p>
                    </div>

                    <button
                      onClick={() => addItem({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        image: item.image_url || "",
                        category: item.categories?.name || "",
                        description: item.description,
                      })}
                      className="mt-2 mx-4 mb-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Add to Order
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-200 pt-8">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-gray-600 mb-4">Share the menu with friends to earn points!</p>
          <button
            onClick={handleShare}
            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2 mx-auto"
          >
            <Share className="w-5 h-5" />
            <span>Share for Points</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
