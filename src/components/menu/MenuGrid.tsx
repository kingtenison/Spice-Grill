
import Image from "next/image";
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
            "group relative aspect-square bg-gray-900 rounded-[2rem] overflow-hidden border border-gray-100 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer",
            selectedItemId === item.id ? "ring-2 ring-red-500 shadow-xl" : ""
          )}
          onClick={() => onItemSelect(item)}
        >
          {/* Square Image fills the whole card */}
          <Image
            src={getMenuItemImage(item)}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {/* Bottom gradient for legible text */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

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

          {/* Content overlaid at the bottom */}
          <div className="absolute inset-x-0 bottom-0 p-5 z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-red-600 px-2 py-1 rounded">
                {item.categories?.name || "Uncategorized"}
              </span>
              {item.preparation_time && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-white/70 uppercase">
                  <Clock className="w-3 h-3" />
                  {item.preparation_time}m
                </span>
              )}
            </div>

            <h3 className="text-xl font-heading text-white mb-1 line-clamp-1">
              {item.name}
            </h3>

            <p className="text-sm text-white/70 line-clamp-2 leading-relaxed">
              {item.description}
            </p>

            {onAddToCart && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(item);
                }}
                className="mt-4 w-full bg-white text-gray-900 px-4 py-2.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300 hover:bg-red-600 hover:text-white"
              >
                <Plus className="w-5 h-5" />
                Add to Cart
              </button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}