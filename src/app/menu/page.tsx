"use client";

import { useState, useEffect, useMemo } from "react";
import { useCartStore } from "@/store/useCartStore";
import { MenuGrid } from "@/components/menu/MenuGrid";
import { ItemDetailModal } from "@/components/menu/ItemDetailModal";
import { Plus, Search, ShoppingBag, SlidersHorizontal, X, Phone, Filter, Leaf, Wheat, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  images?: string[];
  categories?: {
    name: string;
  } | null;
  // Extended fields from database
  ingredients?: string[] | null;
  calories?: number | null;
  allergens?: string[] | null;
  dietary_tags?: string[] | null;
  preparation_time?: number | null;
  cooking_method?: string | null;
  nutritional_info?: {
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
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
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [dietaryFilters, setDietaryFilters] = useState<string[]>([]);

  const addItem = useCartStore((state) => state.addItem);

  // Enhanced menu items with parsed data from database
  const enhancedMenuItems = useMemo(() => {
    return menuItems.map(item => {
      // Process images - handle different possible formats
      let images: string[] = [];

      // If images is already an array, use it
      if (item.images && Array.isArray(item.images)) {
        images = item.images.filter(img => img && typeof img === 'string');
      }
      // If image_url exists, try to parse it or use as single image
      else if (item.image_url) {
        // Check if image_url is a JSON string array
        if (typeof item.image_url === 'string' && item.image_url.startsWith('[')) {
          try {
            const parsed = JSON.parse(item.image_url);
            images = Array.isArray(parsed) ? parsed.filter(img => img && typeof img === 'string') : [item.image_url];
          } catch {
            images = [item.image_url];
          }
        } else {
          // Single image URL
          images = [item.image_url];
        }
      }

      // Ensure we have valid image URLs
      images = images.filter(img =>
        img &&
        typeof img === 'string' &&
        (img.startsWith('http') || img.startsWith('/')) &&
        !img.includes('undefined') &&
        !img.includes('null')
      );

      // Add fallback image if no valid images
      if (images.length === 0) {
        images = [`https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&h=400&fit=crop`];
      }

      // Debug logging for image issues
      if (process.env.NODE_ENV === 'development' && item.name === 'Sample Item') {
        console.log('Image processing for item:', item.name, {
          originalImages: item.images,
          imageUrl: item.image_url,
          processedImages: images
        });
      }

      return {
        ...item,
        images,
        // Use real data from database with fallbacks for missing data
        ingredients: item.ingredients || [],
        calories: item.calories || null,
        allergens: item.allergens || [],
        dietary_tags: item.dietary_tags || [],
        preparation_time: item.preparation_time || null,
        cooking_method: item.cooking_method || null,
        nutritional_info: item.nutritional_info || null
      };
    });
  }, [menuItems]);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function fetchData() {
      setIsLoading(true);
      try {
        const [categoriesResult, menuResult] = await Promise.all([
          supabase.from('categories').select('*').order('name'),
          supabase.from('menu_items').select('*, categories(name)').eq('is_available', true).order('created_at', { ascending: false }),
        ]);

        if (categoriesResult.error) {
          console.error("Error fetching categories:", categoriesResult.error);
        } else if (categoriesResult.data && isMounted) {
          setCategories(categoriesResult.data);
        }

        if (menuResult.error) {
          console.error("Error fetching menu items:", menuResult.error);
        } else if (menuResult.data && isMounted) {
          setMenuItems(menuResult.data);
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

  // Filter items by category, search, and dietary restrictions
  const filteredItems = useMemo(() => {
    return enhancedMenuItems.filter((item) => {
      const itemCategory = item.categories?.name || "Uncategorized";
      const matchesCategory = activeCategory === "All" || itemCategory === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDietary = dietaryFilters.length === 0 ||
                            dietaryFilters.every(filter => item.dietary_tags?.includes(filter));

      return matchesCategory && matchesSearch && matchesDietary;
    });
  }, [enhancedMenuItems, activeCategory, searchQuery, dietaryFilters]);

  // Available dietary options
  const dietaryOptions = [
    { id: 'vegan', label: 'Vegan', icon: Leaf },
    { id: 'vegetarian', label: 'Vegetarian', icon: Leaf },
    { id: 'gluten-free', label: 'Gluten-Free', icon: Wheat },
    { id: 'spicy', label: 'Spicy', icon: Flame },
  ];

  const handleItemSelect = (item: MenuItem) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  const handleCloseModal = () => {
    setShowItemModal(false);
    setSelectedItem(null);
  };

  const toggleDietaryFilter = (filterId: string) => {
    setDietaryFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const getImageUrl = (item: MenuItem) => {
    return item.images?.[0] || `https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&h=400&fit=crop`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white overflow-x-hidden">

      <main className="container mx-auto pt-20 pb-24 px-4 pb-mobile-nav lg:pl-sidebar">
        {/* Header */}
        <div className="text-center mb-8 px-2">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3 text-gray-900"
          >
            Our Menu
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto px-4"
          >
            Discover our handcrafted dishes made with premium local ingredients.
          </motion.p>
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-6"
        >
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search dishes..."
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all text-sm sm:text-base text-gray-900 placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter - Horizontal scroll on mobile */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <span className="text-xs sm:text-sm font-medium text-gray-700 flex-shrink-0 hidden sm:inline">Category:</span>
              {categoryList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all border flex-shrink-0",
                    activeCategory === cat
                      ? "bg-red-600 text-white border-red-600 shadow-md"
                      : "bg-white text-gray-700 hover:border-red-600 hover:text-red-600 border-gray-200"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Dietary Filters - Horizontal scroll on mobile */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <span className="text-xs sm:text-sm font-medium text-gray-700 flex-shrink-0">Dietary:</span>
              {dietaryOptions.map((option) => {
                const Icon = option.icon;
                const isActive = dietaryFilters.includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleDietaryFilter(option.id)}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-2 rounded-full text-xs font-medium transition-all border flex-shrink-0",
                      isActive
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-gray-700 hover:border-green-600 hover:text-green-600 border-gray-200"
                    )}
                  >
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filters Display */}
          {(dietaryFilters.length > 0 || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-600">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                  &quot;{searchQuery}&quot;
                  <button onClick={() => setSearchQuery("")} className="hover:bg-blue-200 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {dietaryFilters.map((filter) => (
                <span key={filter} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                  {dietaryOptions.find(opt => opt.id === filter)?.label}
                  <button onClick={() => toggleDietaryFilter(filter)} className="hover:bg-green-200 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={() => {
                  setSearchQuery("");
                  setDietaryFilters([]);
                  setActiveCategory("All");
                }}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </motion.div>

        {/* Menu Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full"></div>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="space-y-8">
              {/* Featured/Current Category Header */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {activeCategory === "All" ? "Featured Dishes" : activeCategory}
                </h2>
                <p className="text-gray-600">
                  {filteredItems.length} {filteredItems.length === 1 ? 'dish' : 'dishes'} available
                </p>
              </div>

              {/* Grid */}
              <MenuGrid
                items={filteredItems}
                onItemSelect={handleItemSelect}
                selectedItemId={selectedItem?.id}
                onAddToCart={(item) => addItem({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  image: item.images?.[0] || getImageUrl(item),
                  category: item.categories?.name || "Uncategorized",
                  description: item.description
                })}
              />
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-gray-900">No dishes found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search or filters.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setDietaryFilters([]);
                  setActiveCategory("All");
                }}
                className="px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
              >
                Show All Dishes
              </button>
            </div>
          )}
        </motion.div>

        {/* No data message */}
        {!isLoading && menuItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-gradient-to-r from-red-50 to-orange-50 rounded-3xl mt-12 border border-red-100"
          >
            <h3 className="text-3xl font-bold mb-4 text-gray-900">Menu Coming Soon</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Our chefs are crafting the perfect menu with seasonal ingredients. Check back shortly for our latest creations!
            </p>
            <a
              href="tel:+15551234567"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30"
            >
              <Phone className="w-5 h-5" />
              Call for Updates
            </a>
          </motion.div>
        )}
      </main>

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={showItemModal}
        onClose={handleCloseModal}
      />

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
      className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-50"
    >
      <a
        href="/cart"
        className="flex items-center gap-4 sm:gap-6 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-red-600 text-white shadow-xl shadow-red-500/30 hover:bg-red-700 transition-all"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm">
            {count}
          </div>
          <span className="font-bold text-sm sm:text-base">Cart</span>
        </div>
        <div className="w-[1px] h-5 sm:h-6 bg-white/20" />
        <span className="font-extrabold text-base sm:text-xl">${total.toFixed(2)}</span>
      </a>
    </motion.div>
  );
}