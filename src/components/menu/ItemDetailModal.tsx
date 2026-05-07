
import { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  Clock,
  ChefHat,
  AlertTriangle,
  Leaf,
  Wheat,
  Flame,
  Heart,
  Zap,
  ChevronLeft,
  ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/useCartStore';

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

interface ItemDetailModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ItemDetailModal({ item, isOpen, onClose }: ItemDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const items = useCartStore((state) => state.items);

  // Reset state when modal opens with a new item
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedImage(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen, item]);

  if (!item) return null;

  const cartItem = items.find(cartItem => cartItem.id === item.id);
  const currentQuantity = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.images?.[0] || item.image_url || '',
        category: item.categories?.name || "Uncategorized",
        description: item.description
      });
    }
    onClose(); // Close after adding
  };

  const images = item.images && item.images.length > 0
    ? item.images
    : [item.image_url || `https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&h=400&fit=crop`].filter(Boolean) as string[];

  const getDietaryIcon = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'vegan': return <Leaf className="w-4 h-4" />;
      case 'gluten-free': return <Wheat className="w-4 h-4" />;
      case 'spicy': return <Flame className="w-4 h-4" />;
      case 'healthy': return <Heart className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Side Drawer Content */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full md:max-w-xl lg:max-w-2xl bg-white z-[101] shadow-2xl flex flex-col"
          >
            {/* Header / Image Section */}
            <div className="relative h-[40vh] sm:h-[45vh] flex-shrink-0 bg-gray-100">
              <div className="absolute inset-0">
                <img
                  src={images[selectedImage]}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
              </div>

              {/* Top Navigation */}
              <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
                <button
                  onClick={onClose}
                  className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-gray-900 transition-all border border-white/20"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex gap-2">
                  <button className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-gray-900 transition-all border border-white/20">
                    <Heart className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Image Indicators */}
              {images.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        selectedImage === i ? "bg-white w-8" : "bg-white/40 w-1.5"
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Title Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8 pt-20">
                 <span className="inline-block px-3 py-1 rounded-lg bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest mb-3">
                   {item.categories?.name || "Uncategorized"}
                 </span>
                 <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading text-white leading-tight">
                   {item.name}
                 </h1>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-8 custom-scrollbar">
              {/* Features Quick Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                   <div className="flex items-center gap-2 mb-1">
                     <Clock className="w-4 h-4 text-orange-500" />
                     <span className="text-[10px] font-bold uppercase text-gray-400">Time</span>
                   </div>
                   <p className="text-sm font-bold text-gray-900">{item.preparation_time || 15}m</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                   <div className="flex items-center gap-2 mb-1">
                     <Zap className="w-4 h-4 text-yellow-500" />
                     <span className="text-[10px] font-bold uppercase text-gray-400">Calories</span>
                   </div>
                   <p className="text-sm font-bold text-gray-900">{item.calories || '---'} kcal</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 col-span-2 sm:col-span-1">
                   <div className="flex items-center gap-2 mb-1">
                     <ChefHat className="w-4 h-4 text-blue-500" />
                     <span className="text-[10px] font-bold uppercase text-gray-400">Method</span>
                   </div>
                   <p className="text-sm font-bold text-gray-900 truncate">{item.cooking_method || 'Grill'}</p>
                </div>
              </div>

              {/* Description Section */}
              <div className="mb-10">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">About this dish</h3>
                <p className="text-lg text-gray-600 leading-relaxed font-light">
                  {item.description}
                </p>
              </div>

              {/* Dietary Tags Section */}
              {item.dietary_tags && item.dietary_tags.length > 0 && (
                 <div className="mb-10">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Dietary Information</h3>
                   <div className="flex flex-wrap gap-2">
                     {item.dietary_tags.map(tag => (
                       <span key={tag} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-bold border border-green-100">
                         {getDietaryIcon(tag)}
                         {tag}
                       </span>
                     ))}
                   </div>
                 </div>
              )}

              {/* Ingredients Section */}
              {item.ingredients && item.ingredients.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Key Ingredients</h3>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    {item.ingredients.map((ingredient, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                        <span className="text-gray-700 font-medium">{ingredient}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nutritional Section */}
              {item.nutritional_info && (
                <div className="mb-10">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Nutrition per serving</h3>
                  <div className="grid grid-cols-4 gap-4 p-6 bg-gray-900 rounded-[2rem] text-white">
                    <div className="text-center">
                      <p className="text-xl font-bold text-red-500">{item.nutritional_info.protein || 0}g</p>
                      <p className="text-[10px] uppercase text-gray-400 font-bold">Protein</p>
                    </div>
                    <div className="text-center border-l border-white/10">
                      <p className="text-xl font-bold text-blue-400">{item.nutritional_info.carbs || 0}g</p>
                      <p className="text-[10px] uppercase text-gray-400 font-bold">Carbs</p>
                    </div>
                    <div className="text-center border-l border-white/10">
                      <p className="text-xl font-bold text-orange-400">{item.nutritional_info.fat || 0}g</p>
                      <p className="text-[10px] uppercase text-gray-400 font-bold">Fat</p>
                    </div>
                    <div className="text-center border-l border-white/10">
                      <p className="text-xl font-bold text-purple-400">{item.nutritional_info.fiber || 0}g</p>
                      <p className="text-[10px] uppercase text-gray-400 font-bold">Fiber</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Allergen Section */}
              {item.allergens && item.allergens.length > 0 && (
                <div className="mb-10 p-6 rounded-[2rem] bg-orange-50 border border-orange-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-orange-700" />
                    </div>
                    <h3 className="font-bold text-orange-900">Allergen Warning</h3>
                  </div>
                  <p className="text-sm text-orange-800/80 leading-relaxed">
                    This dish contains: <span className="font-bold">{item.allergens.join(', ')}</span>. Please inform your server of any allergies.
                  </p>
                </div>
              )}
              
              {/* Extra Spacing for bottom bar */}
              <div className="h-24" />
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 bg-white/80 backdrop-blur-xl border-t border-gray-100 flex items-center gap-4 sm:gap-6 z-20">
               <div className="flex items-center gap-4 bg-gray-100 p-1 rounded-2xl">
                 <button
                   onClick={() => setQuantity(Math.max(1, quantity - 1))}
                   className="w-12 h-12 flex items-center justify-center rounded-xl bg-white shadow-sm hover:text-red-600 transition-all active:scale-90"
                 >
                   <Minus className="w-5 h-5" />
                 </button>
                 <span className="font-bold text-xl min-w-[2rem] text-center">{quantity}</span>
                 <button
                   onClick={() => setQuantity(quantity + 1)}
                   className="w-12 h-12 flex items-center justify-center rounded-xl bg-white shadow-sm hover:text-red-600 transition-all active:scale-90"
                 >
                   <Plus className="w-5 h-5" />
                 </button>
               </div>
               
               <button
                 onClick={handleAddToCart}
                 className="flex-1 h-14 bg-red-600 text-white font-bold rounded-2xl flex items-center justify-between px-6 hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95"
               >
                 <div className="flex items-center gap-2">
                   <ShoppingBag className="w-5 h-5" />
                   <span>Add to Order</span>
                 </div>
                 <span className="text-xl font-extrabold">${(item.price * quantity).toFixed(2)}</span>
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}