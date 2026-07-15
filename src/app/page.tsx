"use client";

import { motion, useInView, animate } from "framer-motion";
import {
  ArrowRight,
  Star,
  Clock,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Flame,
  ChefHat,
  Wine,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";



const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
};

// Count-up number that animates when scrolled into view
function CountUp({ value, suffix = "", className }: { value: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  );
}


export default function HomePage() {
  const addItem = useCartStore((state) => state.addItem);

  // Auto-redirect admins/employees to their panels when visiting the public homepage
  useEffect(() => {
    const checkAndRedirectStaff = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.role === "admin") {
          window.location.replace("/admin");
        } else if (profile?.role === "employee") {
          window.location.replace("/employee");
        }
      } catch {
        // Silently ignore — user stays on homepage
      }
    };

    checkAndRedirectStaff();
  }, []);

  const categories = [
    {
      name: "Mains",
      description: "Hearty, soul-satisfying plates",
      image: "/Fried Yam and Fish.jpg",
      itemCount: 12,
      href: "/menu?category=Mains",
    },
    {
      name: "Signature",
      description: "Chef's specialty creations",
      image: "/Pounded _Yam and Egusi.jpg",
      itemCount: 8,
      href: "/menu?category=Signature",
    },
    {
      name: "Protein",
      description: "Fresh fish & grilled favorites",
      image: "/Tilapia.jpg",
      itemCount: 10,
      href: "/menu?category=Protein",
    },
    {
      name: "Drinks",
      description: "Refreshing tropical beverages",
      image: "/Mango_Drink.jpg",
      itemCount: 15,
      href: "/menu?category=Drinks",
    },
  ];

  const featuredDishes = [
    {
      id: "fried-yam-fish",
      name: "Fried Yam & Fish",
      description: "Golden, crispy yam slices paired with perfectly seasoned fried fish. A beloved West African classic that crunchs with every bite.",
      price: 14,
      image: "/Fried Yam and Fish.jpg",
      category: "Mains",
      featured: true,
    },
    {
      id: "fried-chicken",
      name: "Fried Chicken",
      description: "Juicy, succulent chicken coated in our secret spice blend and fried to golden perfection. Crispy outside, tender inside.",
      price: 12,
      image: "/Fried_chicken.jpg",
      category: "Mains",
      featured: false,
    },
    {
      id: "fried-rice",
      name: "Fried Rice",
      description: "Wok-tossed rice with aromatic spices, fresh vegetables, and your choice of protein. A fiery, satisfying plate that hits every note.",
      price: 13,
      image: "/Fried_Rice.png",
      category: "Mains",
      featured: false,
    },
    {
      id: "pounded-yam-egusi",
      name: "Pounded Yam & Egusi Soup",
      description: "Smooth, pillowy pounded yam served with rich, melon seed-based egusi soup. A timeless Nigerian delicacy done right.",
      price: 16,
      image: "/Pounded _Yam and Egusi.jpg",
      category: "Signature",
      featured: false,
    },
    {
      id: "waakye",
      name: "Waakye",
      description: "Fragrant rice and beans cooked together with millet leaves, served with gari, spaghetti, and your favorite protein. The ultimate comfort plate.",
      price: 15,
      image: "/Waakye.jpg",
      category: "Signature",
      featured: false,
    },
    {
      id: "tilapia",
      name: "Grilled Tilapia",
      description: "Whole tilapia grilled over open flame with our signature pepper sauce. Smoky, spicy, and impossibly fresh.",
      price: 18,
      image: "/Tilapia.jpg",
      category: "Signature",
      featured: true,
    },
    {
      id: "kenkey-pepper",
      name: "Kenkey with Pepper",
      description: "Fermented corn dough served with fiery homemade pepper sauce and fresh fish. A bold Ghanaian staple that packs serious heat.",
      price: 13,
      image: "/Kenkey+with+Pepper-+Sheeda+Travel+Tribe.png",
      category: "Signature",
      featured: false,
    },
    {
      id: "mango-drink",
      name: "Fresh Mango Drink",
      description: "Sun-ripened mangoes blended into a smooth, tropical refresher. Sweet, creamy, and the perfect companion to any spicy dish.",
      price: 5,
      image: "/Mango_Drink.jpg",
      category: "Drinks",
      featured: false,
    },
    {
      id: "pineapple-drink",
      name: "Pineapple Punch",
      description: "Tangy, sweet pineapple juice with a hint of ginger. Refreshingly bright and bursting with island sunshine.",
      price: 5,
      image: "/Pineapple_Drink.png",
      category: "Drinks",
      featured: false,
    },
    {
      id: "strawberry-drink",
      name: "Strawberry Bliss",
      description: "Luscious strawberries blended into a vibrant, silky drink. A sweet escape in every sip.",
      price: 5,
      image: "/Strawberry_Drink.jpg",
      category: "Drinks",
      featured: false,
    },
  ];

  // Helper variables to locate specific items for the redesigned Bento layout
  const heroDish = featuredDishes.find(d => d.id === "fried-yam-fish");
  const chickenDish = featuredDishes.find(d => d.id === "fried-chicken");
  const riceDish = featuredDishes.find(d => d.id === "fried-rice");
  const poundedYamDish = featuredDishes.find(d => d.id === "pounded-yam-egusi");
  const waakyeDish = featuredDishes.find(d => d.id === "waakye");
  const tilapiaDish = featuredDishes.find(d => d.id === "tilapia");
  const kenkeyDish = featuredDishes.find(d => d.id === "kenkey-pepper");
  const drinkDishes = featuredDishes.filter(d => d.category === "Drinks");

  const [activeDrinkIdx, setActiveDrinkIdx] = useState(0);


  const testimonials = [
    {
      name: "Michael Torres",
      role: "Food Critic",
      text: "The depth of flavor at Spice Grille is unmatched. Every dish tells a story of passion and precision. The ribeye is simply perfection.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&h=100&fit=crop",
    },
    {
      name: "Sarah Chen",
      role: "Regular Diner",
      text: "An incredible dining experience from start to finish. The ambiance, service, and food come together perfectly. My go-to spot for celebrations.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&h=100&fit=crop",
    },
    {
      name: "James Wilson",
      role: "Local Chef",
      text: "As a chef myself, I'm exceptionally picky about where I eat. Spice Grille surpasses all expectations. The attention to detail is remarkable.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&h=100&fit=crop",
    },
  ];

  return (
    <div className="relative flex flex-col min-h-screen bg-white overflow-hidden">
      {/* Hero Section — Split-Screen Editorial Design */}
      <section className="relative h-screen lg:min-h-screen lg:flex lg:divide-x divide-gray-200 bg-white">
        {/* Mobile: Full-screen background image with overlay */}
        <div className="lg:hidden absolute inset-0">
          <motion.div
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 20, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <img
              src="/Fried Yam and Fish.jpg"
              alt="Fried Yam and Fish"
              className="w-full h-full object-cover"
              fetchPriority="high"
            />
          </motion.div>
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </div>

        {/* Mobile: Content overlay — matches deployed design */}
        <div className="lg:hidden relative h-screen flex flex-col items-center justify-center px-6 sm:px-8 pt-16 pb-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-4 sm:mb-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs sm:text-sm font-medium border border-white/30">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
              <span>Authentic Afro-Caribbean Cuisine</span>
            </div>
          </motion.div>

          {/* Headline — centered, stacked */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mb-3 sm:mb-4"
          >
            <h1 className="font-display font-bold text-white leading-[0.95] tracking-tight" style={{ fontSize: 'clamp(42px, 14vw, 64px)' }}>
              The
              <br />
              <span className="text-orange-400">Spice Grille</span>
            </h1>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-white/80 leading-relaxed text-center max-w-sm sm:max-w-md mx-auto mb-6 sm:mb-8" style={{ fontSize: 'clamp(13px, 3.5vw, 15px)' }}
          >
            Bold flavors. Perfect flame. Unforgettable moments. Experience the art of Afro-Caribbean cuisine.
          </motion.p>

          {/* CTA Buttons — side by side */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mb-8 sm:mb-10"
          >
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/menu"
                className="inline-flex items-center justify-center gap-2 font-semibold text-white rounded-full bg-orange-600 hover:bg-orange-700 transition-colors duration-300" style={{ fontSize: 'clamp(13px, 3.2vw, 15px)', padding: 'clamp(11px, 3vw, 14px) clamp(18px, 5vw, 28px)' }}
              >
                View Full Menu
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
              <Link
                href="/reservations"
                className="inline-flex items-center justify-center gap-2 font-semibold text-white rounded-full bg-white/15 backdrop-blur-sm border border-white/30 hover:bg-white/25 transition-colors duration-300" style={{ fontSize: 'clamp(13px, 3.2vw, 15px)', padding: 'clamp(11px, 3vw, 14px) clamp(18px, 5vw, 28px)' }}
              >
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Reserve
              </Link>
            </div>
          </motion.div>

          {/* Trust Indicators — 3 column grid with icons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 w-full max-w-sm sm:max-w-md mx-auto"
          >
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" fill="currentColor" />
              <span className="font-bold text-white text-lg sm:text-2xl">4.9</span>
              <span className="text-white/60 text-[10px] sm:text-xs">Google Rating</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
              <span className="font-bold text-white text-lg sm:text-2xl">12min</span>
              <span className="text-white/60 text-[10px] sm:text-xs">Avg. Wait</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
              <span className="font-bold text-white text-lg sm:text-2xl">11+</span>
              <span className="text-white/60 text-[10px] sm:text-xs">Years</span>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-5 h-8 rounded-full border-2 border-white/30 flex items-start justify-center p-1"
            >
              <div className="w-1 h-1.5 bg-white/60 rounded-full" />
            </motion.div>
          </motion.div>
        </div>
        {/* Desktop: Split-screen layout */}
        <div className="hidden lg:flex w-full lg:divide-x divide-gray-200">
          {/* Left Side — Full-Height Food Photography */}
          <div className="w-1/2 h-screen relative overflow-hidden">
            <motion.div
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 20, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <img
                src="/Fried Yam and Fish.jpg"
                alt="Fried Yam and Fish"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>

          {/* Right Side — Editorial Typography */}
          <div className="w-1/2 h-screen flex items-center justify-center px-16 bg-white">
            <div className="max-w-xl">
              {/* Location Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-8"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100 text-stone-600 text-sm font-medium">
                  <MapPin className="w-4 h-4" />
                  Moorhead, Minnesota
                </div>
              </motion.div>

              {/* Headline — Elegant Serif Typography */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mb-8"
              >
                <h1 className="font-serif text-7xl xl:text-8xl font-bold text-stone-900 leading-[1.1] tracking-tight">
                  The
                  <br />
                  <span className="text-orange-600">Spice Grille</span>
                </h1>
              </motion.div>

              {/* Description — Clean Editorial Copy */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-lg text-stone-600 leading-relaxed mb-10 max-w-lg"
              >
                Experience the bold flavors of West Africa and the Caribbean. From smoky grilled tilapia to rich egusi soup, every dish tells a story of tradition and passion.
              </motion.p>

              {/* CTA Buttons — Side by Side */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex items-center gap-4"
              >
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-stone-900 text-white font-medium rounded-lg hover:bg-stone-800 transition-colors duration-300"
                >
                  View Full Menu
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/reservations"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-stone-900 font-medium rounded-lg border border-stone-300 hover:border-stone-400 hover:bg-stone-50 transition-colors duration-300"
                >
                  <Calendar className="w-5 h-5" />
                  Make Reservation
                </Link>
              </motion.div>

              {/* Trust Indicators — 3 Column */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="flex items-center gap-6 mt-12 pt-12 border-t border-stone-200"
              >
                <div className="text-center">
                  <div className="text-2xl font-semibold text-stone-900">11+</div>
                  <div className="text-sm text-stone-500">Years</div>
                </div>
                <div className="w-px h-10 bg-stone-200" />
                <div className="text-center">
                  <div className="text-2xl font-semibold text-stone-900">4.9</div>
                  <div className="text-sm text-stone-500">Google Rating</div>
                </div>
                <div className="w-px h-10 bg-stone-200" />
                <div className="text-center">
                  <div className="text-2xl font-semibold text-stone-900">12min</div>
                  <div className="text-sm text-stone-500">Avg. Wait</div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section — Exciting & Appetizing */}
      <section className="relative py-24 sm:py-32 bg-gradient-to-br from-stone-100 via-orange-50 to-red-50 overflow-hidden">
        {/* Animated background gradients */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-orange-400/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-red-400/15 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-yellow-400/10 rounded-full blur-[100px]" />

        <div className="container relative px-4 mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-12 sm:mb-16"
          >
            <motion.span
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs sm:text-sm font-semibold tracking-wider uppercase shadow-lg shadow-orange-500/30"
            >
              <Flame className="w-4 h-4" />
              Explore Our Menu
            </motion.span>
            <motion.h2
              variants={fadeInUp}
              className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mt-6 mb-4 text-stone-900"
            >
              Taste the <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">Tradition</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-stone-600 text-base sm:text-lg max-w-2xl mx-auto"
            >
              From sizzling mains to refreshing tropical drinks — every dish tells a story of bold African flavors and Caribbean passion.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6"
          >
            {categories.map((category, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                className={cn(
                  "group relative overflow-hidden cursor-pointer rounded-2xl sm:rounded-3xl shadow-xl shadow-orange-900/10 hover:shadow-2xl hover:shadow-orange-900/20 transition-all duration-500",
                  i === 0 ? "col-span-2 row-span-2 aspect-square sm:aspect-[4/3]" : "aspect-square"
                )}
              >
                {/* Image with zoom effect */}
            <motion.img
              src={category.image}
              alt={category.name}
              className="object-cover w-full h-full"
              loading="lazy"
              decoding="async"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.5 }}
            />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-90 group-hover:opacity-85 transition-opacity" />
                
                {/* Animated border glow */}
                <motion.div
                  className="absolute inset-0 border-2 border-transparent group-hover:border-orange-400/50 rounded-2xl sm:rounded-3xl transition-colors duration-300"
                  whileHover={{
                    boxShadow: "0 0 30px rgba(251, 146, 60, 0.3)"
                  }}
                />

                {/* Steam effect on hover */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: "linear-gradient(to top, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)"
                  }}
                  animate={{
                    backgroundPosition: ["0% 100%", "0% 0%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6">
                  <motion.span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/80 backdrop-blur-sm text-white text-[10px] sm:text-xs font-semibold uppercase tracking-wider"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Clock className="w-3 h-3" />
                    {category.itemCount} items
                  </motion.span>
                  <motion.h3
                    className={cn(
                      "font-heading font-bold text-white mt-2 sm:mt-3 mb-1 sm:mb-2 group-hover:text-orange-300 transition-colors",
                      i === 0 ? "text-xl sm:text-2xl md:text-3xl" : "text-base sm:text-lg md:text-2xl"
                    )}
                  >
                    {category.name}
                  </motion.h3>
                  <motion.p
                    className={cn(
                      "text-white/90 line-clamp-2 group-hover:text-white transition-colors",
                      i === 0 ? "text-sm sm:text-base md:text-base" : "text-xs sm:text-sm md:text-sm"
                    )}
                  >
                    {category.description}
                  </motion.p>
                </div>

                {/* Hover glow effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                />
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-12 sm:mt-16"
          >
            <Link
              href="/menu"
              className="inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-bold rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 transition-all duration-300 group shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/50 hover:scale-105"
            >
              View Full Menu
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Dishes — Appetite-Inducing */}
      <section className="relative py-20 sm:py-32 bg-stone-950 overflow-hidden">
        {/* Warm ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-orange-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-red-900/15 rounded-full blur-[120px]" />

        <div className="container relative px-4 sm:px-6 mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-12 sm:mb-16"
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 rounded-full bg-orange-500/15 border border-orange-500/25"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
              </span>
              <span className="text-orange-300 text-xs sm:text-sm font-semibold tracking-wide uppercase">Fresh Today</span>
            </motion.div>

            <motion.h2
              variants={fadeInUp}
              className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-white"
            >
              Taste the <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Tradition</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-stone-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed"
            >
              Every dish tells a story of bold spices, slow-cooked love, and African culinary heritage. Bite in and feel right at home.
            </motion.p>
          </motion.div>

          {/* Bento Box Layout */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 auto-rows-auto lg:auto-rows-[270px]">
            {/* Hero Card: Fried Yam & Fish */}
            <motion.div
              variants={scaleIn}
              className="group relative col-span-2 row-span-2 rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-stone-900 via-stone-900/95 to-black border border-white/[0.08] shadow-xl hover:shadow-orange-500/10 hover:border-orange-500/30 transition-all duration-500 flex flex-col justify-between"
            >
              {/* Image & Overlay */}
              <div className="relative w-full h-[200px] sm:h-[260px] lg:h-1/2 overflow-hidden">
                <motion.img
                  src={heroDish?.image}
                  alt={heroDish?.name}
                  className="object-cover w-full h-full"
                  loading="lazy"
                  decoding="async"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.6 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-600/30">
                    <Flame className="w-3.5 h-3.5 animate-pulse" /> Chef's Pick
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-orange-400 text-xs font-semibold border border-white/10">
                    <Star className="w-3 h-3 fill-orange-400 text-orange-400" /> 4.9
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 pb-5 sm:p-6 md:p-8 flex flex-col justify-between flex-grow lg:h-1/2">
                <div>
                  <span className="text-orange-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 sm:mb-1.5 block">
                    {heroDish?.category}
                  </span>
                  <h3 className="font-heading text-xl sm:text-2xl md:text-3xl font-extrabold text-white mb-1.5 sm:mb-2 md:mb-3 leading-tight tracking-tight">
                    {heroDish?.name}
                  </h3>
                  <p className="text-stone-400 text-[11px] sm:text-xs md:text-sm leading-relaxed mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">
                    {heroDish?.description}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 sm:gap-4 mt-auto pt-2 border-t border-white/[0.06]">
                  <div className="flex flex-col">
                    <span className="text-[9px] sm:text-[10px] text-stone-500 uppercase tracking-widest font-semibold">Price</span>
                    <span className="text-xl sm:text-2xl md:text-3xl font-black text-white">${heroDish?.price}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (heroDish) {
                        addItem(heroDish);
                        toast.success(`Added ${heroDish.name} to order!`);
                      }
                    }}
                    className="group/btn inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-600/25 hover:shadow-orange-600/40 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 cursor-pointer"
                  >
                    <span>Order Now</span>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Pounded Yam & Egusi (Signature Vertical Card) */}
            <motion.div
              variants={scaleIn}
              className="group relative col-span-1 row-span-1 rounded-2xl sm:rounded-3xl overflow-hidden bg-[#12110f]/90 border border-white/[0.08] shadow-xl hover:shadow-orange-500/10 hover:border-orange-500/30 transition-all duration-500 flex flex-col justify-between"
            >
              {/* Image Section */}
              <div className="relative w-full h-[140px] sm:h-[200px] md:h-[280px] lg:h-[60%] overflow-hidden">
                <motion.img
                  src={poundedYamDish?.image}
                  alt={poundedYamDish?.name}
                  className="object-cover w-full h-full"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.6 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-orange-400 text-xs font-semibold border border-white/10">
                    Signature
                  </span>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-3 sm:p-4 lg:p-5 flex flex-col justify-between flex-grow lg:h-[40%]">
                <div>
                  <span className="text-orange-400/80 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-0.5 sm:mb-1 block">
                    {poundedYamDish?.category}
                  </span>
                  <h3 className="font-heading text-sm sm:text-base md:text-xl font-bold text-white mb-1 sm:mb-1.5 group-hover:text-orange-300 transition-colors line-clamp-1">
                    {poundedYamDish?.name}
                  </h3>
                  <p className="text-stone-400 text-[10px] sm:text-xs leading-relaxed mb-2 sm:mb-3 line-clamp-2">
                    {poundedYamDish?.description}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 sm:gap-3 mt-auto pt-1.5 sm:pt-2 border-t border-white/[0.06]">
                  <span className="text-base sm:text-lg md:text-xl font-black text-white">${poundedYamDish?.price}</span>
                  <button
                    onClick={() => {
                      if (poundedYamDish) {
                        addItem(poundedYamDish);
                        toast.success(`Added ${poundedYamDish.name} to order!`);
                      }
                    }}
                    className="p-2 sm:p-2.5 rounded-full bg-orange-500 text-white hover:bg-orange-400 active:scale-95 transition-all duration-200 cursor-pointer shadow-lg shadow-orange-500/20"
                    title="Add to order"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Waakye (Signature Card) */}
            {waakyeDish && (
              <motion.div
                variants={scaleIn}
                className="group relative col-span-1 row-span-1 rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-900 border border-white/[0.08] shadow-md hover:shadow-orange-500/10 hover:border-orange-500/30 transition-all duration-500 flex flex-col justify-end min-h-[180px] sm:min-h-[220px]"
              >
                {/* Image background */}
                <div className="absolute inset-0 z-0">
                  <motion.img
                    src={waakyeDish.image}
                    alt={waakyeDish.name}
                    className="object-cover w-full h-full"
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.6 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/65 to-black/20" />
                </div>

                {/* Content overlay */}
                <div className="relative z-10 p-3 sm:p-4 lg:p-5 w-full">
                  <span className="text-orange-400/80 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mb-0.5 block">
                    {waakyeDish.category}
                  </span>
                  <h3 className="font-heading text-xs sm:text-sm md:text-lg font-bold text-white mb-0.5 sm:mb-1 group-hover:text-orange-300 transition-colors line-clamp-1">
                    {waakyeDish.name}
                  </h3>
                  <p className="text-stone-300 text-[9px] sm:text-[11px] leading-relaxed mb-2 sm:mb-3 line-clamp-2 group-hover:text-white transition-colors">
                    {waakyeDish.description}
                  </p>

                  <div className="flex items-center justify-between gap-2 pt-1.5 sm:pt-2 border-t border-white/[0.08]">
                    <span className="text-sm sm:text-base md:text-lg font-bold text-white">${waakyeDish.price}</span>
                    <button
                      onClick={() => {
                        addItem(waakyeDish);
                        toast.success(`Added ${waakyeDish.name} to order!`);
                      }}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-400 active:scale-90 transition-all duration-200 cursor-pointer shadow-md"
                      title="Add to order"
                    >
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Fried Rice (Mains Card) */}
            {riceDish && (
              <motion.div
                variants={scaleIn}
                className="group relative col-span-1 row-span-1 rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-900 border border-white/[0.08] shadow-md hover:shadow-orange-500/10 hover:border-orange-500/30 transition-all duration-500 flex flex-col justify-end min-h-[180px] sm:min-h-[220px]"
              >
                {/* Image background */}
                <div className="absolute inset-0 z-0">
                  <motion.img
                    src={riceDish.image}
                    alt={riceDish.name}
                    className="object-cover w-full h-full"
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.6 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/65 to-black/20" />
                </div>

                {/* Content overlay */}
                <div className="relative z-10 p-3 sm:p-4 lg:p-5 w-full">
                  <span className="text-orange-400/80 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mb-0.5 block">
                    {riceDish.category}
                  </span>
                  <h3 className="font-heading text-xs sm:text-sm md:text-lg font-bold text-white mb-0.5 sm:mb-1 group-hover:text-orange-300 transition-colors line-clamp-1">
                    {riceDish.name}
                  </h3>
                  <p className="text-stone-300 text-[9px] sm:text-[11px] leading-relaxed mb-2 sm:mb-3 line-clamp-2 group-hover:text-white transition-colors">
                    {riceDish.description}
                  </p>

                  <div className="flex items-center justify-between gap-2 pt-1.5 sm:pt-2 border-t border-white/[0.08]">
                    <span className="text-sm sm:text-base md:text-lg font-bold text-white">${riceDish.price}</span>
                    <button
                      onClick={() => {
                        addItem(riceDish);
                        toast.success(`Added ${riceDish.name} to order!`);
                      }}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-400 active:scale-90 transition-all duration-200 cursor-pointer shadow-md"
                      title="Add to order"
                    >
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Kenkey with Pepper (Signature Card) */}
            {kenkeyDish && (
              <motion.div
                variants={scaleIn}
                className="group relative col-span-1 row-span-1 rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-900 border border-white/[0.08] shadow-md hover:shadow-orange-500/10 hover:border-orange-500/30 transition-all duration-500 flex flex-col justify-end min-h-[180px] sm:min-h-[220px]"
              >
                {/* Image background */}
                <div className="absolute inset-0 z-0">
                  <motion.img
                    src={kenkeyDish.image}
                    alt={kenkeyDish.name}
                    className="object-cover w-full h-full"
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.6 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/65 to-black/20" />
                </div>

                {/* Content overlay */}
                <div className="relative z-10 p-3 sm:p-4 lg:p-5 w-full">
                  <span className="text-orange-400/80 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mb-0.5 block">
                    {kenkeyDish.category}
                  </span>
                  <h3 className="font-heading text-xs sm:text-sm md:text-lg font-bold text-white mb-0.5 sm:mb-1 group-hover:text-orange-300 transition-colors line-clamp-1">
                    {kenkeyDish.name}
                  </h3>
                  <p className="text-stone-300 text-[9px] sm:text-[11px] leading-relaxed mb-2 sm:mb-3 line-clamp-2 group-hover:text-white transition-colors">
                    {kenkeyDish.description}
                  </p>

                  <div className="flex items-center justify-between gap-2 pt-1.5 sm:pt-2 border-t border-white/[0.08]">
                    <span className="text-sm sm:text-base md:text-lg font-bold text-white">${kenkeyDish.price}</span>
                    <button
                      onClick={() => {
                        addItem(kenkeyDish);
                        toast.success(`Added ${kenkeyDish.name} to order!`);
                      }}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-400 active:scale-90 transition-all duration-200 cursor-pointer shadow-md"
                      title="Add to order"
                    >
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Grilled Tilapia (Signature Wide Card) */}
            <motion.div
              variants={scaleIn}
              className="group relative col-span-2 row-span-1 rounded-2xl sm:rounded-3xl overflow-hidden bg-[#12110f]/90 border border-white/[0.08] shadow-xl hover:shadow-orange-500/10 hover:border-orange-500/30 transition-all duration-500 flex flex-col sm:flex-row h-full"
            >
              {/* Image Portion */}
              <div className="relative w-full sm:w-[40%] h-[140px] sm:h-[180px] sm:h-full overflow-hidden">
                <motion.img
                  src={tilapiaDish?.image}
                  alt={tilapiaDish?.name}
                  className="object-cover w-full h-full"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.6 }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-stone-950/60 hidden sm:block" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent sm:hidden" />
                
                <div className="absolute top-4 left-4 flex gap-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-600/90 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm shadow-md">
                    <Flame className="w-3.5 h-3.5" /> Popular
                  </span>
                </div>
              </div>

              {/* Content Portion */}
              <div className="p-4 sm:p-5 sm:p-6 flex flex-col justify-between flex-grow w-full sm:w-[60%]">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-orange-400/80 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                      {tilapiaDish?.category}
                    </span>
                    <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-stone-400">Whole Fish</span>
                  </div>
                  <h3 className="font-heading text-sm sm:text-base md:text-xl font-bold text-white mb-1.5 sm:mb-2 group-hover:text-orange-300 transition-colors">
                    {tilapiaDish?.name}
                  </h3>
                  <p className="text-stone-400 text-[10px] sm:text-xs leading-relaxed mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">
                    {tilapiaDish?.description}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 mt-auto pt-2 border-t border-white/[0.06]">
                  <span className="text-lg sm:text-xl font-black text-white">${tilapiaDish?.price}</span>
                  <button
                    onClick={() => {
                      if (tilapiaDish) {
                        addItem(tilapiaDish);
                        toast.success(`Added ${tilapiaDish.name} to order!`);
                      }
                    }}
                    className="group/btn inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-orange-500 text-white font-bold text-[10px] sm:text-xs hover:bg-orange-400 active:scale-95 transition-all duration-200 cursor-pointer shadow-lg shadow-orange-500/20"
                  >
                    <span>Add to Order</span>
                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Fried Chicken (Mains Card) */}
            {chickenDish && (
              <motion.div
                variants={scaleIn}
                className="group relative col-span-1 row-span-1 rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-900 border border-white/[0.08] shadow-md hover:shadow-orange-500/10 hover:border-orange-500/30 transition-all duration-500 flex flex-col justify-end min-h-[180px] sm:min-h-[220px]"
              >
                {/* Image background */}
                <div className="absolute inset-0 z-0">
                  <motion.img
                    src={chickenDish.image}
                    alt={chickenDish.name}
                    className="object-cover w-full h-full"
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.6 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/65 to-black/20" />
                </div>

                {/* Content overlay */}
                <div className="relative z-10 p-3 sm:p-4 lg:p-5 w-full">
                  <span className="text-orange-400/80 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mb-0.5 block">
                    {chickenDish.category}
                  </span>
                  <h3 className="font-heading text-xs sm:text-sm md:text-lg font-bold text-white mb-0.5 sm:mb-1 group-hover:text-orange-300 transition-colors line-clamp-1">
                    {chickenDish.name}
                  </h3>
                  <p className="text-stone-300 text-[9px] sm:text-[11px] leading-relaxed mb-2 sm:mb-3 line-clamp-2 group-hover:text-white transition-colors">
                    {chickenDish.description}
                  </p>

                  <div className="flex items-center justify-between gap-2 pt-1.5 sm:pt-2 border-t border-white/[0.08]">
                    <span className="text-sm sm:text-base md:text-lg font-bold text-white">${chickenDish.price}</span>
                    <button
                      onClick={() => {
                        addItem(chickenDish);
                        toast.success(`Added ${chickenDish.name} to order!`);
                      }}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-400 active:scale-90 transition-all duration-200 cursor-pointer shadow-md"
                      title="Add to order"
                    >
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Interactive Drinks Card: Desktop only (lg+) */}
            {drinkDishes.length > 0 && (
              <motion.div
                variants={scaleIn}
                className="group relative hidden lg:flex col-span-2 row-span-2 lg:col-start-3 lg:row-start-1 lg:col-span-2 lg:row-span-2 rounded-3xl overflow-hidden bg-stone-900 border border-white/[0.08] shadow-md hover:shadow-orange-500/10 hover:border-orange-500/30 transition-all duration-500 flex-col justify-between min-h-[220px]"
              >
                {/* Dynamic Image Background with cross-fade */}
                <div className="absolute inset-0 z-0">
                  {drinkDishes.map((drink, index) => (
                    <motion.img
                      key={drink.id}
                      src={drink.image}
                      alt={drink.name}
                      className="absolute inset-0 object-cover w-full h-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: activeDrinkIdx === index ? 1 : 0 }}
                      transition={{ duration: 0.4 }}
                    />
                  ))}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-black/35" />
                </div>

                {/* Tabs header at the top */}
                <div className="relative z-10 p-2 flex gap-1 justify-center bg-black/45 backdrop-blur-sm border-b border-white/[0.05]">
                  {drinkDishes.map((drink, index) => {
                    const isActive = activeDrinkIdx === index;
                    let colorClass = "";
                    if (drink.id === "mango-drink") colorClass = isActive ? "bg-amber-500 text-black font-extrabold" : "text-amber-400 hover:bg-amber-500/10";
                    if (drink.id === "pineapple-drink") colorClass = isActive ? "bg-yellow-500 text-black font-extrabold" : "text-yellow-400 hover:bg-yellow-500/10";
                    if (drink.id === "strawberry-drink") colorClass = isActive ? "bg-red-500 text-white font-extrabold" : "text-red-400 hover:bg-red-500/10";

                    return (
                      <button
                        key={drink.id}
                        onClick={() => setActiveDrinkIdx(index)}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer border border-transparent",
                          isActive ? "shadow-sm border-white/20" : "border-white/5",
                          colorClass
                        )}
                      >
                        {drink.id === "mango-drink" && "Mango"}
                        {drink.id === "pineapple-drink" && "Pineapple"}
                        {drink.id === "strawberry-drink" && "Strawberry"}
                      </button>
                    );
                  })}
                </div>

                {/* Content area at the bottom */}
                <div className="relative z-10 p-5 w-full mt-auto">
                  <span className="text-orange-400/80 text-[9px] font-bold uppercase tracking-widest mb-0.5 block">
                    Tropical Refresher
                  </span>
                  
                  <div className="min-h-[72px] flex flex-col justify-start">
                    <h3 className="font-heading text-lg md:text-xl lg:text-2xl font-bold text-white mb-1 transition-colors line-clamp-1">
                      {drinkDishes[activeDrinkIdx]?.name}
                    </h3>
                    <p className="text-stone-300 text-xs md:text-sm leading-relaxed line-clamp-2 md:line-clamp-none">
                      {drinkDishes[activeDrinkIdx]?.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/[0.08] mt-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-stone-500 uppercase tracking-widest font-semibold">Price</span>
                      <span className="text-2xl md:text-3xl font-black text-white">${drinkDishes[activeDrinkIdx]?.price}</span>
                    </div>
                    <button
                      onClick={() => {
                        const currentDrink = drinkDishes[activeDrinkIdx];
                        if (currentDrink) {
                          addItem(currentDrink);
                          toast.success(`Added ${currentDrink.name} to order!`);
                        }
                      }}
                      className="group/btn inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-sm shadow-lg shadow-orange-600/25 hover:shadow-orange-600/40 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 cursor-pointer"
                    >
                      <span>Add to Order</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Separate Drink Cards: Mobile/Tablet only (below lg) */}
            {drinkDishes.map((drink) => (
              <motion.div
                key={drink.id}
                variants={scaleIn}
                className="group relative lg:hidden col-span-1 row-span-1 rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-900 border border-white/[0.08] shadow-md hover:shadow-orange-500/10 hover:border-orange-500/30 transition-all duration-500 flex flex-col justify-end min-h-[180px] sm:min-h-[220px]"
              >
                {/* Image background */}
                <div className="absolute inset-0 z-0">
                  <motion.img
                    src={drink.image}
                    alt={drink.name}
                    className="object-cover w-full h-full"
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.6 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/65 to-black/20" />
                </div>

                {/* Content overlay */}
                <div className="relative z-10 p-3 sm:p-4 lg:p-5 w-full">
                  <span className="text-orange-400/80 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mb-0.5 block">
                    {drink.category}
                  </span>
                  <h3 className="font-heading text-xs sm:text-sm md:text-lg font-bold text-white mb-0.5 sm:mb-1 group-hover:text-orange-300 transition-colors line-clamp-1">
                    {drink.name}
                  </h3>
                  <p className="text-stone-300 text-[9px] sm:text-[11px] leading-relaxed mb-2 sm:mb-3 line-clamp-2 group-hover:text-white transition-colors">
                    {drink.description}
                  </p>

                  <div className="flex items-center justify-between gap-2 pt-1.5 sm:pt-2 border-t border-white/[0.08]">
                    <span className="text-sm sm:text-base md:text-lg font-bold text-white">${drink.price}</span>
                    <button
                      onClick={() => {
                        addItem(drink);
                        toast.success(`Added ${drink.name} to order!`);
                      }}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-400 active:scale-90 transition-all duration-200 cursor-pointer shadow-md"
                      title="Add to order"
                    >
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-10 sm:mt-14"
          >
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-stone-800 text-white font-semibold border border-stone-700 hover:border-orange-500/50 hover:bg-stone-700 transition-all duration-300 group"
            >
              <span>See Full Menu</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="relative py-24 sm:py-32 bg-[#faf5ec] overflow-hidden">
        {/* Soft texture */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.5]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(120,53,15,0.06) 1px, transparent 0)", backgroundSize: "26px 26px" }}
        />

        {/* Scrolling dish-name ribbon */}
        <div className="relative mb-20 border-y border-amber-900/15 py-5 overflow-hidden">
          <motion.div
            aria-hidden
            className="flex whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          >
            {[0, 1].map((dup) => (
              <div key={dup} className="flex items-center shrink-0">
                {["Jollof Rice", "Banku & Tilapia", "Kelewele", "Waakye", "Fufu", "Red Red", "Grilled Suya", "Kontomire Stew"].map((dish, i) => (
                  <span key={`${dup}-${i}`} className="flex items-center text-amber-900/70 font-heading text-2xl sm:text-3xl">
                    <span className="px-6">{dish}</span>
                    <Flame className="w-4 h-4 text-red-600/70" />
                  </span>
                ))}
              </div>
            ))}
          </motion.div>
        </div>

        <div className="container relative px-4 mx-auto">
          {/* Centered headline + narrative */}
          <div className="max-w-3xl mx-auto text-center">
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-3 text-red-600 font-semibold tracking-[0.3em] uppercase text-xs mb-7"
            >
              <span className="w-8 h-px bg-red-600" />
              Akwaaba — Our Story
              <span className="w-8 h-px bg-red-600" />
            </motion.span>

            <motion.h2
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerContainer}
              className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] text-stone-900"
            >
              {["Rooted in Ghana.", "Served in Fargo-Moorhead."].map((line, i) => (
                <span key={i} className="block overflow-hidden">
                  <motion.span
                    variants={{
                      hidden: { y: "110%" },
                      visible: { y: "0%", transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
                    }}
                    className={cn("block", i === 1 && "text-red-600")}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-xl text-stone-700 leading-relaxed mt-8"
            >
              The Spice Grille brings a <span className="text-red-600 font-semibold">redefined mix of Afro-Caribbean cuisine</span> to the Fargo-Moorhead area — proudly serving the community as an authentic African restaurant rooted in the soulful flavors of Ghana.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-base text-stone-600 leading-relaxed mt-5"
            >
              From fragrant jollof rice and hearty banku to spicy kelewele and slow-simmered stews, every dish is built on family recipes passed down through generations. It&apos;s more than a meal — it&apos;s a warm welcome to a taste of home you won&apos;t find anywhere else.
            </motion.p>
          </div>

          {/* Clean 3-image band */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-16"
          >
            {[
              { src: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800&h=900&fit=crop", label: "Bold West African Spice" },
              { src: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?q=80&w=800&h=900&fit=crop", label: "Family Recipes" },
              { src: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&h=900&fit=crop", label: "Made to Share" },
            ].map((img, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
                }}
                className={cn(
                  "group relative aspect-[4/5] rounded-3xl overflow-hidden shadow-lg",
                  i === 2 && "col-span-2 md:col-span-1"
                )}
              >
                <img
                  src={img.src}
                  alt={img.label}
                  loading="lazy"
                  decoding="async"
                  className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-transparent to-transparent" />
                <span className="absolute bottom-5 left-5 right-5 font-heading text-xl text-white">
                  {img.label}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* Inline stat strip */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 mt-16 text-center"
          >
            {[
              { value: 100, suffix: "%", label: "House-Made Spices" },
              { value: 15, suffix: "+", label: "Signature Dishes" },
              { value: 1, suffix: " of 1", label: "Like It in FM" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-6 sm:gap-12">
                <div>
                  <div className="font-heading text-4xl font-bold text-red-600">
                    <CountUp value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs uppercase tracking-wider text-stone-500 mt-1">{stat.label}</div>
                </div>
                {i < 2 && <span className="hidden sm:block w-px h-12 bg-stone-300" />}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-32 bg-gray-50">
        <div className="container px-4 mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <span className="text-red-600 font-semibold tracking-wider uppercase text-sm">
              Testimonials
            </span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold mt-4 mb-6 text-gray-900">
              What Our Guests <span className="text-red-600">Say</span>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="relative bg-white rounded-3xl p-8 border border-gray-200 hover:border-red-600 transition-colors duration-300 shadow-sm hover:shadow-xl"
              >
                <div className="absolute top-6 right-6 text-red-600/20">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
                  </svg>
                </div>

                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-red-600 fill-current" />
                  ))}
                </div>

                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  &ldquo;{testimonial.text}&rdquo;
                </p>

                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    loading="lazy"
                    decoding="async"
                    className="w-12 h-12 rounded-full object-cover border-2 border-red-600"
                  />
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="reservations"
        className="relative py-32 bg-gradient-to-b from-white via-red-50/30 to-white overflow-hidden"
      >
        <div className="container relative px-4 mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="max-w-4xl mx-auto text-center"
          >
            <span className="text-red-600 font-semibold tracking-wider uppercase text-sm">
              Join Us
            </span>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mt-4 mb-6 text-gray-900">
              Reserve Your <span className="text-red-600">Table</span>
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Whether it&apos;s a special occasion or a casual evening,
              we promise an unforgettable dining experience. Dine-in, outdoor seating, or curbside pickup — the choice is yours.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/reservations"
                className="group relative inline-flex items-center gap-3 px-10 py-5 text-lg font-bold rounded-full bg-red-600 text-white overflow-hidden transition-all duration-300 hover:bg-red-700 hover:scale-105 hover:shadow-xl hover:shadow-red-500/40"
              >
                <Calendar className="w-5 h-5" />
                <span>Make Reservation</span>
              </Link>

              <Link
                href="tel:+12184771112"
                className="inline-flex items-center gap-3 px-10 py-5 text-lg font-semibold rounded-full border-2 border-gray-300 text-gray-900 hover:border-red-600 hover:text-red-600 transition-all duration-300"
              >
                <Phone className="w-5 h-5" />
                <span>Call Us: (218) 477-1112</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="relative py-32 bg-white">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact info */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.span
                variants={fadeInUp}
                className="text-red-600 font-semibold tracking-wider uppercase text-sm"
              >
                Contact
              </motion.span>
              <motion.h2
                variants={fadeInUp}
                className="font-heading text-4xl md:text-5xl font-bold mt-4 mb-8 text-gray-900"
              >
                Visit <span className="text-red-600">Us</span>
              </motion.h2>

              <motion.div variants={fadeInUp} className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1 text-gray-900">Location</h4>
                    <p className="text-gray-600">
                      320 Red River Ave Ste D<br />
                      Moorhead, MN 56560-8302
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1 text-gray-900">Phone</h4>
                    <p className="text-gray-600">
                      +1 (218) 477-1112
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1 text-gray-900">Email</h4>
                    <p className="text-gray-600">
                      tsgmoorhead@gmail.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1 text-gray-900">Website</h4>
                    <p className="text-gray-600">
                      www.thespicegrille.com
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Hours */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="bg-white rounded-3xl p-10 border border-gray-200 shadow-xl"
            >
              <h3 className="font-heading text-3xl font-bold mb-8 text-gray-900">
                Hours of <span className="text-red-600">Operation</span>
              </h3>

              <div className="space-y-6">
                {[
                  { day: "Monday - Thursday", hours: "11:00 AM - 9:00 PM" },
                  { day: "Friday - Saturday", hours: "11:00 AM - 10:00 PM" },
                  { day: "Sunday", hours: "12:00 PM - 8:00 PM" },
                ].map((slot, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-4 border-b border-gray-200 last:border-b-0"
                  >
                    <span className="font-medium text-lg text-gray-900">{slot.day}</span>
                    <span className="text-gray-600">{slot.hours}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center gap-3 mb-2">
                  <Wine className="w-5 h-5 text-red-600" />
                  <span className="font-bold text-gray-900">Happy Hour</span>
                </div>
                <p className="text-gray-600 text-sm">
                  Mon-Fri 4-6PM: 20% off all drinks &amp; appetizers
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-950 text-white">
        {/* Main footer */}
        <div className="container px-4 mx-auto py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-12">

            {/* Brand + Socials */}
            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="font-heading text-2xl font-bold mb-3">
                <span className="text-white">THE SPICE</span>
                <span className="text-orange-500"> GRILLE</span>
              </h3>
              <p className="text-stone-400 text-sm leading-relaxed mb-5 max-w-xs">
                Bringing you a redefined mix of Afro-Caribbean cuisine to the Fargo-Moorhead area. Bold flavors, warm hospitality.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://www.tiktok.com/@tsgmoorhead"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-stone-400 hover:bg-orange-600 hover:border-orange-600 hover:text-white transition-all duration-300"
                  aria-label="TikTok"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52V6.8a4.84 4.84 0 01-1-.11z"/></svg>
                </a>
                <a
                  href="https://www.facebook.com/share/1ETFUY425F/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-stone-400 hover:bg-orange-600 hover:border-orange-600 hover:text-white transition-all duration-300"
                  aria-label="Facebook"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a
                  href="https://www.instagram.com/thespicegrillemn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-stone-400 hover:bg-orange-600 hover:border-orange-600 hover:text-white transition-all duration-300"
                  aria-label="Instagram"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a
                  href="https://wa.me/12185938000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-stone-400 hover:bg-orange-600 hover:border-orange-600 hover:text-white transition-all duration-300"
                  aria-label="WhatsApp"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/menu" className="text-stone-400 hover:text-orange-500 transition-colors">Menu</Link></li>
                <li><Link href="/reservations" className="text-stone-400 hover:text-orange-500 transition-colors">Reservations</Link></li>
                <li><Link href="/loyalty" className="text-stone-400 hover:text-orange-500 transition-colors">Rewards</Link></li>
                <li><Link href="/blog" className="text-stone-400 hover:text-orange-500 transition-colors">Our Story</Link></li>
                <li><Link href="/orders" className="text-stone-400 hover:text-orange-500 transition-colors">Order History</Link></li>
              </ul>
            </div>

            {/* Contact + Hours */}
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Visit Us</h4>
              <ul className="space-y-3 text-sm text-stone-400">
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>320 Red River Ave Ste D<br />Moorhead, MN 56560-8302</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <a href="tel:+12184771112" className="hover:text-orange-500 transition-colors">+1 (218) 477-1112</a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <a href="mailto:tsgmoorhead@gmail.com" className="hover:text-orange-500 transition-colors">tsgmoorhead@gmail.com</a>
                </li>
              </ul>
              <div className="mt-5 p-3 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-stone-400 font-semibold mb-1.5">Hours</p>
                <div className="text-xs text-stone-500 space-y-1">
                  <div className="flex justify-between"><span>Mon – Thu</span><span className="text-stone-400">11:30 AM – 10:00 PM</span></div>
                  <div className="flex justify-between"><span>Fri – Sat</span><span className="text-stone-400">11:30 AM – 11:00 PM</span></div>
                  <div className="flex justify-between"><span>Sunday</span><span className="text-stone-400">12:00 PM – 9:00 PM</span></div>
                </div>
              </div>
            </div>

            {/* Services + Legal */}
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Services</h4>
              <ul className="space-y-2.5 text-sm text-stone-400 mb-6">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />Dine-in</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />Outdoor Seating</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />Curbside Pickup</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />Catering</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />Gift Cards</li>
              </ul>
              <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-stone-500 hover:text-orange-500 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-stone-500 hover:text-orange-500 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-stone-500 hover:text-orange-500 transition-colors">Accessibility</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10">
          <div className="container px-4 mx-auto py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-stone-500 text-xs">&copy; 2026 The Spice Grille. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="https://www.tiktok.com/@tsgmoorhead" target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-orange-500 transition-colors" aria-label="TikTok">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52V6.8a4.84 4.84 0 01-1-.11z"/></svg>
              </a>
              <a href="https://www.facebook.com/share/1ETFUY425F/" target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-orange-500 transition-colors" aria-label="Facebook">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://www.instagram.com/thespicegrillemn" target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-orange-500 transition-colors" aria-label="Instagram">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://wa.me/12185938000" target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-orange-500 transition-colors" aria-label="WhatsApp">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}