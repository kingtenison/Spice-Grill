import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  nutritional_info?: {
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  } | null;
}

interface MenuCarouselProps {
  items: MenuItem[];
  onItemSelect: (item: MenuItem) => void;
  selectedItemId?: string;
  onAddToCart?: (item: MenuItem) => void;
}

export function MenuCarousel({ items, onItemSelect, selectedItemId, onAddToCart }: MenuCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const itemsPerView = 4; // Adjust based on screen size
  const totalSlides = Math.ceil(items.length / itemsPerView);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Handle mouse/touch drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (carouselRef.current?.offsetLeft || 0));
    setScrollLeft(carouselRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (carouselRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Auto-scroll effect
  useEffect(() => {
    if (!carouselRef.current) return;

    const scrollAmount = currentIndex * (carouselRef.current.clientWidth / itemsPerView);
    carouselRef.current.scrollTo({
      left: scrollAmount,
      behavior: 'smooth'
    });
  }, [currentIndex, itemsPerView]);

  if (items.length === 0) return null;

  return (
    <div className="relative w-full">
      {/* Navigation buttons */}
      <button
        onClick={prevSlide}
        className="carousel-nav-btn absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-lg"
        disabled={currentIndex === 0}
      >
        <ChevronLeft className="w-6 h-6 text-gray-700" />
      </button>

      <button
        onClick={nextSlide}
        className="carousel-nav-btn absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-lg"
        disabled={currentIndex === totalSlides - 1}
      >
        <ChevronRight className="w-6 h-6 text-gray-700" />
      </button>

      {/* Carousel container */}
      <div
        ref={carouselRef}
        className={cn(
          "flex overflow-x-auto scrollbar-hide gap-6 pb-4 select-none",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "flex-shrink-0 w-80 bg-white rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:shadow-xl cursor-pointer transform hover:scale-105",
              selectedItemId === item.id
                ? "border-red-500 shadow-lg shadow-red-500/20"
                : "border-gray-200 hover:border-red-300"
            )}
            style={{ scrollSnapAlign: 'start' }}
            onClick={() => onItemSelect(item)}
          >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={item.images?.[0] || `https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&h=400&fit=crop`}
                    alt={item.name}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                  />

                  {/* Price badge */}
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="font-bold text-red-600">${item.price.toFixed(2)}</span>
                  </div>

                  {/* Add to cart button */}
                  {onAddToCart && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(item);
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-full font-medium hover:bg-red-700 transition-colors shadow-lg"
                      >
                        Add to Cart
                      </button>
                    </div>
                  )}

              {/* Dietary tags */}
              {item.dietary_tags && item.dietary_tags.length > 0 && (
                <div className="absolute top-4 left-4 flex flex-wrap gap-1">
                  {item.dietary_tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {item.dietary_tags.length > 2 && (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                      +{item.dietary_tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                  {item.categories?.name || "Uncategorized"}
                </span>
                {item.calories && (
                  <span className="text-xs text-gray-500">{item.calories} cal</span>
                )}
              </div>

              <h3 className="text-lg font-bold mb-2 text-gray-900 line-clamp-1">
                {item.name}
              </h3>

              <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                {item.description}
              </p>

              {/* Quick info */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                {item.preparation_time && (
                  <span className="flex items-center gap-1">
                    🕒 {item.preparation_time}min
                  </span>
                )}
                {item.ingredients && (
                  <span>{item.ingredients.length} ingredients</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              currentIndex === index ? "bg-red-600 w-8" : "bg-gray-300"
            )}
          />
        ))}
      </div>
    </div>
  );
}