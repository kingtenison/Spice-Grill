import { useState } from 'react';
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
  Users
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

  if (!item) return null;

  const cartItem = items.find(cartItem => cartItem.id === item.id);
  const currentQuantity = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image_url || '',
        category: item.categories?.name || "Uncategorized",
        description: item.description
      });
    }
    setQuantity(1);
  };

  const handleUpdateQuantity = (newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove from cart if quantity becomes 0
      updateQuantity(item.id, 0);
    } else {
      updateQuantity(item.id, newQuantity);
    }
  };

  // Use actual uploaded images, with fallbacks if needed
  const images = item.images && item.images.length > 0
    ? item.images
    : [
        `https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&h=400&fit=crop`,
        `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?q=80&w=600&h=400&fit=crop`,
        `https://images.unsplash.com/photo-1551782450-17144efb5723?q=80&w=600&h=400&fit=crop`,
      ];

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col lg:flex-row">
              {/* Image Gallery */}
              <div className="lg:w-1/2 relative">
                <div className="aspect-square relative overflow-hidden bg-gray-100">
                  <img
                    src={images[selectedImage]}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-700" />
                  </button>

                  {/* Image navigation dots */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          selectedImage === index ? "bg-white" : "bg-white/50"
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Thumbnail gallery */}
                <div className="flex gap-2 p-4 bg-gray-50">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={cn(
                        "w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                        selectedImage === index ? "border-red-500" : "border-gray-200"
                      )}
                    >
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="lg:w-1/2 p-8 overflow-y-auto max-h-[90vh] lg:max-h-none">
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold uppercase tracking-wider text-red-600">
                      {item.categories?.name || "Uncategorized"}
                    </span>
                    {item.dietary_tags?.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full"
                      >
                        {getDietaryIcon(tag)}
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.name}</h1>

                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-3xl font-bold text-red-600">${item.price.toFixed(2)}</span>
                    {item.calories && (
                      <span className="text-sm text-gray-600">{item.calories} calories</span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>

                {/* Cooking Info */}
                {(item.preparation_time || item.cooking_method) && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Cooking Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {item.preparation_time && (
                        <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                          <Clock className="w-5 h-5 text-orange-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Prep Time</p>
                            <p className="text-sm text-gray-600">{item.preparation_time} minutes</p>
                          </div>
                        </div>
                      )}
                      {item.cooking_method && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                          <ChefHat className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Cooking Method</p>
                            <p className="text-sm text-gray-600">{item.cooking_method}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Ingredients */}
                {item.ingredients && item.ingredients.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Ingredients</h3>
                    <div className="flex flex-wrap gap-2">
                      {item.ingredients.map((ingredient, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                        >
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nutritional Info */}
                {item.nutritional_info && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Nutritional Information</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {item.nutritional_info.protein && (
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{item.nutritional_info.protein}g</p>
                          <p className="text-xs text-gray-600">Protein</p>
                        </div>
                      )}
                      {item.nutritional_info.carbs && (
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{item.nutritional_info.carbs}g</p>
                          <p className="text-xs text-gray-600">Carbs</p>
                        </div>
                      )}
                      {item.nutritional_info.fat && (
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600">{item.nutritional_info.fat}g</p>
                          <p className="text-xs text-gray-600">Fat</p>
                        </div>
                      )}
                      {item.nutritional_info.fiber && (
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">{item.nutritional_info.fiber}g</p>
                          <p className="text-xs text-gray-600">Fiber</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Allergens */}
                {item.allergens && item.allergens.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      Allergen Information
                    </h3>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-800 mb-2">Contains:</p>
                      <div className="flex flex-wrap gap-2">
                        {item.allergens.map((allergen, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full"
                          >
                            {allergen}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Add to Cart */}
                <div className="border-t pt-6">
                  {currentQuantity > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">In cart:</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleUpdateQuantity(currentQuantity - 1)}
                            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-semibold min-w-[2rem] text-center">{currentQuantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(currentQuantity + 1)}
                            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-center text-sm text-gray-600">
                        Total: ${(item.price * currentQuantity).toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Quantity:</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-semibold min-w-[2rem] text-center">{quantity}</span>
                          <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={handleAddToCart}
                        className="w-full py-4 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
                      >
                        Add to Cart - ${(item.price * quantity).toFixed(2)}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}