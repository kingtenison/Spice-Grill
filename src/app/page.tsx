"use client";

import { motion, useScroll, useTransform } from "framer-motion";
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
  Award,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

import { Navbar } from "@/components/layout/Navbar";

/* Animation variants */
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

export default function HomePage() {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 600], [1, 0.95]);
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
          .single();

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
      name: "Signature Grills",
      description: "Premium cuts flame-grilled to perfection",
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&h=600&fit=crop",
      itemCount: 12,
      href: "/menu?category=Signature Grills",
    },
    {
      name: "Spice Blends",
      description: "House-made seasonings and rubs",
      image: "https://images.unsplash.com/photo-1593443320739-77f74939d0da?q=80&w=800&h=600&fit=crop",
      itemCount: 8,
      href: "/menu?category=Spice Blends",
    },
    {
      name: "Smokehouse",
      description: "Wood-smoked specialties",
      image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?q=80&w=800&h=600&fit=crop",
      itemCount: 10,
      href: "/menu?category=Smokehouse",
    },
    {
      name: "Sides & Salads",
      description: "Fresh accompaniments",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&h=600&fit=crop",
      itemCount: 15,
      href: "/menu?category=Sides & Salads",
    },
  ];

  const featuredDishes = [
    {
      id: "signature-ribeye",
      name: "Spice Grille Signature Ribeye",
      description: "Prime 16oz ribeye with our house spice blend, char-grilled to your liking. Served with garlic mashed potatoes and seasonal vegetables.",
      price: 42,
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&h=400&fit=crop",
      category: "Signature Grills",
      featured: true,
    },
    {
      id: "smoked-brisket",
      name: "Smoked Brisket Platter",
      description: "12-hour smoked brisket with pickled vegetables and garlic mash. Our signature dry rub creates a perfect bark.",
      price: 34,
      image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=600&h=400&fit=crop",
      category: "Smokehouse",
      featured: false,
    },
    {
      id: "spice-rubbed-chicken",
      name: "Spice-Rubbed Chicken",
      description: "Half chicken marinated in our secret blend, grilled over oak coals. Juicy, flavorful, and perfectly charred.",
      price: 24,
      image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=600&h=400&fit=crop",
      category: "Signature Grills",
      featured: false,
    },
    {
      id: "cedar-plank-salmon",
      name: "Cedar Plank Salmon",
      description: "Atlantic salmon roasted on a cedar plank with a maple-bourbon glaze. Infused with deep woody aromas and smoky sweetness.",
      price: 32,
      image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=600&h=400&fit=crop",
      category: "Signature Grills",
      featured: false,
    },
  ];

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
      <Navbar />

      {/* Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen pt-20 flex items-center overflow-hidden"
      >
        {/* Background accents */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 via-white to-orange-50/20" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-100/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-orange-50/50 rounded-full blur-[120px]" />

        {/* Hero content */}
        <div className="relative z-10 container px-4 mx-auto">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-5 py-2 mb-8 text-sm font-medium rounded-full bg-red-50 border border-red-100 text-gray-900"
            >
              <Flame className="w-4 h-4 text-red-600" />
              <span>Authentic Wood-Fired Grill • Est. 2024</span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="font-heading text-6xl md:text-8xl lg:text-9xl font-bold leading-[0.95] mb-8 tracking-tight text-gray-900"
            >
              <span className="text-gray-900">SPICE</span>
              <br />
              <span className="text-red-600">GRILLE</span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              Bold flavors. Perfect flame. Unforgettable moments.
              Experience the art of premium wood-fired cooking.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/menu"
                className="group relative inline-flex items-center gap-3 px-10 py-5 text-lg font-bold rounded-full bg-red-600 text-white overflow-hidden transition-all duration-300 hover:bg-red-700 hover:scale-105 hover:shadow-xl hover:shadow-red-500/40"
              >
                <span className="relative z-10">View Full Menu</span>
                <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/reservations"
                className="inline-flex items-center gap-3 px-10 py-5 text-lg font-bold rounded-full border-2 border-gray-300 text-gray-900 hover:border-red-600 hover:text-red-600 transition-all duration-300"
              >
                <Calendar className="w-5 h-5" />
                <span>Make a Reservation</span>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto"
            >
              {[
                { icon: Star, value: "4.9", label: "Google Rating" },
                { icon: Clock, value: "25 min", label: "Avg. Wait" },
                { icon: Award, value: "10+ years", label: "Master Chefs" },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <stat.icon className="w-6 h-6 text-red-600" />
                  <span className="font-bold text-2xl text-gray-900">{stat.value}</span>
                  <span className="text-sm text-gray-600">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-6 h-10 rounded-full border-2 border-gray-300 flex items-start justify-center p-1"
          >
            <div className="w-1 h-2 bg-red-600 rounded-full" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* About Section */}
      <section className="relative py-32 bg-white overflow-hidden">
        {/* Background texture */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-red-50/30 to-white opacity-50" />

        <div className="container relative px-4 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image side */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="relative"
            >
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200&h=1500&fit=crop"
                  alt="Spice Grille Interior - Wood-fired kitchen"
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent" />
              </div>
              {/* Floating accent card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute -bottom-8 -right-8 bg-red-600 text-white p-6 rounded-2xl max-w-xs shadow-xl"
              >
                <div className="flex items-center gap-3 mb-2">
                  <ChefHat className="w-6 h-6" />
                  <span className="font-bold">Award-Winning</span>
                </div>
                <p className="text-sm opacity-90">
                  Voted &quot;Best Grill&quot; 2024 by Food & Wine Magazine
                </p>
              </motion.div>
            </motion.div>

            {/* Text side */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="flex flex-col justify-center"
            >
              <motion.span
                variants={fadeInUp}
                className="text-red-600 font-semibold tracking-wider uppercase text-sm mb-4"
              >
                Our Story
              </motion.span>

              <motion.h2
                variants={fadeInUp}
                className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight text-gray-900"
              >
                Where Fire Meets <span className="text-red-600">Artistry</span>
              </motion.h2>

              <motion.p
                variants={fadeInUp}
                className="text-lg text-gray-700 leading-relaxed mb-6"
              >
                Founded on a passion for authentic wood-fired cooking, Spice Grille brings
                the primal essence of flame and smoke to modern dining. Our chefs have
                mastered the delicate balance between bold spices and delicate technique.
              </motion.p>

              <motion.p
                variants={fadeInUp}
                className="text-lg text-gray-700 leading-relaxed mb-8"
              >
                Every cut of meat, every blend of spices, and every ember in our grill
                is chosen with intention. We don&apos;t just cook—we craft experiences that
                linger in memory long after the last bite.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="grid grid-cols-2 gap-6"
              >
                {[
                  { icon: Flame, text: "Wood-Fired Grill" },
                  { icon: ShieldCheck, text: "Premium Quality" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-red-600" />
                    </div>
                    <span className="font-medium text-gray-900">{item.text}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="relative py-32 bg-gray-50">
        <div className="container px-4 mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.span
              variants={fadeInUp}
              className="text-red-600 font-semibold tracking-wider uppercase text-sm"
            >
              Explore
            </motion.span>
            <motion.h2
              variants={fadeInUp}
              className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mt-4 mb-6 text-gray-900"
            >
              Our Culinary <span className="text-red-600">Categories</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-gray-600 text-lg max-w-2xl mx-auto"
            >
              Discover the diverse flavors that define Spice Grille.
              Each category represents a unique approach to fire and spice.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {categories.map((category, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                className="group relative aspect-[4/3] rounded-3xl overflow-hidden cursor-pointer card-hover bg-white border border-gray-200"
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-70 transition-opacity" />
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-red-600/50 transition-colors duration-300 rounded-3xl" />

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-red-200 text-sm font-semibold uppercase tracking-wider">
                    {category.itemCount} items
                  </span>
                  <h3 className="font-heading text-2xl font-bold text-white mt-1 mb-2">
                    {category.name}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {category.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-12"
          >
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold rounded-full bg-white text-gray-900 border border-gray-300 hover:border-red-600 hover:text-red-600 transition-all duration-300 group shadow-sm hover:shadow-md"
            >
              Browse Full Menu
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Dishes */}
      <section className="relative py-32 bg-white overflow-hidden">
        <div className="container relative px-4 mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-20"
          >
            <motion.span
              variants={fadeInUp}
              className="text-red-600 font-semibold tracking-wider uppercase text-sm"
            >
              Chef&apos;s Selection
            </motion.span>
            <motion.h2
              variants={fadeInUp}
              className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mt-4 mb-6 text-gray-900"
            >
              Featured <span className="text-red-600">Dishes</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-gray-600 text-lg max-w-2xl mx-auto"
            >
              Hand-picked favorites from our executive chef.
              Must-try items that define the Spice Grille experience.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px] md:auto-rows-[300px]"
          >
            {featuredDishes.map((dish, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className={cn(
                  "group relative bg-white rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl border border-gray-200",
                  i === 0 ? "md:col-span-2 md:row-span-2" : "",
                  i === 1 ? "md:col-span-1 md:row-span-1" : "",
                  i === 2 ? "md:col-span-1 md:row-span-1" : "",
                  i === 3 ? "md:col-span-3 md:row-span-1" : ""
                )}
              >
                {/* Image */}
                <div className="absolute inset-0 w-full h-full">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                </div>

                {/* Content */}
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <div className="relative z-10">
                    {dish.featured && (
                      <span className="inline-block px-3 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider mb-3">
                        Chef's Selection
                      </span>
                    )}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={cn(
                          "font-heading text-white leading-tight mb-2",
                          i === 0 ? "text-3xl md:text-5xl" : "text-2xl"
                        )}>
                          {dish.name}
                        </h3>
                        <p className={cn(
                          "text-white/80 line-clamp-2 max-w-md",
                          i === 0 ? "text-lg" : "text-sm"
                        )}>
                          {dish.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-red-400 font-bold text-2xl">
                          ${dish.price}
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addItem({
                          id: dish.id,
                          name: dish.name,
                          price: dish.price,
                          image: dish.image,
                          category: dish.category,
                          description: dish.description
                        });
                      }}
                      className="mt-6 px-6 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium hover:bg-white hover:text-gray-900 transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0"
                    >
                      Add to Order
                    </button>
                  </div>
                </div>
              </motion.div>
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
                {/* Quote marks */}
                <div className="absolute top-6 right-6 text-red-600/20">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
                  </svg>
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-red-600 fill-current" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  &ldquo;{testimonial.text}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
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
              we promise an unforgettable dining experience. Book your table today.
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
                href="tel:+15551234567"
                className="inline-flex items-center gap-3 px-10 py-5 text-lg font-semibold rounded-full border-2 border-gray-300 text-gray-900 hover:border-red-600 hover:text-red-600 transition-all duration-300"
              >
                <Phone className="w-5 h-5" />
                <span>Call Us: (555) 123-4567</span>
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
                      123 Grill Street<br />
                      New York, NY 10001
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
                      (555) 123-4567<br />
                      (555) 987-6543
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
                      hello@spicegrille.com<br />
                      reservations@spicegrille.com
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
                  { day: "Monday - Thursday", hours: "11:30 AM - 10:00 PM" },
                  { day: "Friday - Saturday", hours: "11:30 AM - 11:00 PM" },
                  { day: "Sunday", hours: "12:00 PM - 9:00 PM" },
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
      <footer className="bg-gray-50 border-t border-gray-200 py-16">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="font-heading text-2xl font-bold mb-4 text-gray-900">
                <span className="text-gray-900">SPICE</span>
                <span className="text-red-600">GRILLE</span>
              </h3>
              <p className="text-gray-600 mb-4">
                Wood-fired perfection since 2024.
              </p>
              <div className="flex gap-4">
                {["Ig", "Fb", "Tw"].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-red-600 hover:text-red-600 transition-colors"
                  >
                    <span className="text-sm font-bold">{social}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {["Menu", "Reservations", "Catering", "Gift Cards"].map(
                  (link) => (
                    <li key={link}>
                      <Link
                        href="#"
                        className="text-gray-600 hover:text-red-600 transition-colors"
                      >
                        {link}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2">
                {["Privacy Policy", "Terms of Service", "Accessibility"].map(
                  (link) => (
                    <li key={link}>
                      <Link
                        href="#"
                        className="text-gray-600 hover:text-red-600 transition-colors"
                      >
                        {link}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Stay Updated</h4>
              <p className="text-gray-600 mb-4">
                Get exclusive offers and updates.
              </p>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-red-600 focus:outline-none transition-colors"
                />
                <button className="px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
            <p>&copy; 2026 Spice Grille. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}