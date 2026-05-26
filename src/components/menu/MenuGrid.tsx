
import { cn, getMenuItemImage } from '@/lib/utils';
import { Plus, ShoppingCart, Clock, Flame, Leaf, Wheat } from 'lucide-react';
import { motion } from 'framer-motion';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  images?: string[];
  categories?: {
    name: string;
  } | null;
  ingredients?: string[] | null;
  calories?: number | null;
  allergens?: string[] | null;
  dietary_tags?: string[] | null;
  preparation_time?: number | null;
  cooking_method?: string | null;
}

interface MenuGridProps {
  items: MenuItem[];
  onItemSelect: (item: MenuItem) => void;
  selectedItemId?: string;
  onAddToCart?: (item: MenuItem) => void;
}

export function MenuGrid({ items, onItemSelect, selectedItemId, onAddToCart }: MenuGridProps) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            "group relative bg-white rounded-[2rem] overflow-hidden border border-gray-100 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer",
            selectedItemId === item.id ? "ring-2 ring-red-500 shadow-xl" : ""
          )}
          onClick={() => onItemSelect(item)}
        >
          {/* Image Container */}
          <div className="relative aspect-[4/5] overflow-hidden">
            <img
              src={getMenuItemImage(item)}
              alt={item.name}
              className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
            />
            
            {/* Price Tag */}
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-white/20">
                <span className="font-bold text-red-600 text-lg">${item.price.toFixed(2)}</span>
              </div>
            </div>

            {/* Dietary Tags */}
            {item.dietary_tags && item.dietary_tags.length > 0 && (
              <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                {item.dietary_tags.slice(0, 2).map((tag) => (
                  <div key={tag} className="bg-green-500/90 backdrop-blur-sm p-2 rounded-xl text-white">
                    {tag.toLowerCase() === 'spicy' ? <Flame className="w-4 h-4" /> : 
                     tag.toLowerCase() === 'vegan' ? <Leaf className="w-4 h-4" /> : 
                     tag.toLowerCase() === 'gluten-free' ? <Wheat className="w-4 h-4" /> : 
                     <Plus className="w-4 h-4" />}
                  </div>
                ))}
              </div>
            )}

            {/* Quick Add Overlay */}
            {onAddToCart && (
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(item);
                  }}
                  className="bg-white text-gray-900 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-2xl hover:bg-red-600 hover:text-white"
                >
                  <Plus className="w-5 h-5" />
                  Quick Add
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 px-2 py-1 rounded">
                {item.categories?.name || "Uncategorized"}
              </span>
              {item.preparation_time && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                  <Clock className="w-3 h-3" />
                  {item.preparation_time}m
                </span>
              )}
            </div>

            <h3 className="text-xl font-heading text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
              {item.name}
            </h3>

            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">
              {item.description}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
               <span className="text-xs font-medium text-gray-400">View Details</span>
               <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-red-50 transition-colors">
                 <Plus className="w-4 h-4 text-gray-300 group-hover:text-red-600 transition-colors" />
               </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}