"use client";

import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useCartStore } from "@/store/useCartStore";
import { Plus, Search, ShoppingBag, SlidersHorizontal, X, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  categories?: {
    name: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch categories
        const { data: categoriesData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (categoriesData && isMounted) {
          setCategories(categoriesData);
        }

        // Fetch menu items with category join
        const { data: menuData, error: menuError } = await supabase
          .from('menu_items')
          .select(`
            *,
            categories(name)
          `)
          .eq('is_available', true)
          .order('created_at', { ascending: false });

        if (menuError) {
          console.error("Error fetching menu items:", menuError);
        } else if (menuData && isMounted) {
          setMenuItems(menuData);
        }
      } catch (err) {
        console.error("Unexpected error fetching data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchData();

    return () => { isMounted = false };
  }, []);

  // Build category list from fetched categories + "All"
  const categoryList = useMemo(() => {
    const catNames = categories.map(c => c.name);
    return ["All", ...catNames];
  }, [categories]);

  // Filter items by category and search
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const itemCategory = item.categories?.name || "Uncategorized";
      const matchesCategory = activeCategory === "All" || itemCategory === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, searchQuery]);

  const getImageUrl = (item: MenuItem) => {
    return item.image_url || `https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&h=400&fit=crop`;
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="container px-4 py-12 mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900">Our Menu</h1>
            <p className="text-gray-600 text-lg">
              {menuItems.length > 0
                ? `Explore ${menuItems.length} handcrafted dishes made with premium local ingredients.`
                : "Discover our carefully curated selection of wood-fired specialties."
              }
            </p>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search dishes..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-colors text-gray-900 placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className={cn(
          "flex items-center gap-3 overflow-x-auto pb-4 mb-12 no-scrollbar",
          showFilters ? "flex" : "hidden md:flex"
        )}>
          {categoryList.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border",
                activeCategory === cat
                  ? "bg-red-600 text-white border-red-600 shadow-md"
                  : "bg-white text-gray-700 hover:border-red-600 hover:text-red-600 border-gray-200"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[420px] rounded-2xl bg-gray-100 animate-pulse" />
            ))
          ) : filteredItems.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={item.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-red-600 transition-all hover:shadow-xl hover:shadow-gray-200/50"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={getImageUrl(item)}
                      alt={item.name}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => addItem({
                          id: item.id,
                          name: item.name,
                          price: item.price,
                          image: getImageUrl(item),
                          category: item.categories?.name || "Uncategorized"
                        })}
                        className="p-3 rounded-xl bg-white/95 backdrop-blur-sm text-gray-900 hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-90"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                        {item.categories?.name || "Uncategorized"}
                      </span>
                      <span className="text-lg font-bold text-gray-900">${item.price.toFixed(2)}</span>
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-gray-900 group-hover:text-red-600 transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {item.description || ""}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="col-span-full py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-gray-900">No dishes found</h3>
              <p className="text-gray-600">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>

        {/* No data message */}
        {!isLoading && menuItems.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-3xl mt-12">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Menu Coming Soon</h3>
            <p className="text-gray-600 mb-4">Our chefs are crafting the perfect menu. Check back shortly!</p>
            <a
              href="tel:+15551234567"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call for Updates
            </a>
          </div>
        )}
      </main>

      {/* Floating Cart */}
      <CartStatusButton />
    </div>
  );
}

function CartStatusButton() {
  const items = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.getTotal());
  const count = items.reduce((acc, item) => acc + item.quantity, 0);

  if (count === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
    >
      <a
        href="/cart"
        className="flex items-center gap-6 px-8 py-4 rounded-2xl bg-red-600 text-white shadow-xl shadow-red-500/30 hover:bg-red-700 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">
            {count}
          </div>
          <span className="font-bold">View Cart</span>
        </div>
        <div className="w-[1px] h-6 bg-white/20" />
        <span className="font-extrabold text-xl">${total.toFixed(2)}</span>
      </a>
    </motion.div>
  );
}