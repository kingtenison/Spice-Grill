"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, Award, BookOpen, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useCartStore } from "@/store/useCartStore";

export function BottomNav() {
  const pathname = usePathname();
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/menu", label: "Menu", icon: UtensilsCrossed },
    { href: "/loyalty", label: "Rewards", icon: Award },
    { href: "/blog", label: "Story", icon: BookOpen },
    { href: "/cart", label: "Cart", icon: ShoppingCart, badge: cartCount },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200">
      <div className="grid grid-cols-5 h-16">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);
          const showBadge = link.badge && link.badge > 0;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 transition-colors",
                active ? "text-red-600" : "text-gray-600 hover:text-red-600"
              )}
            >
              <div className="flex items-center gap-0.5">
                <Icon className="w-5 h-5" />
                {showBadge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-600 text-[8px] font-bold text-white leading-none px-0.5"
                  >
                    {link.badge > 9 ? '9+' : link.badge}
                  </motion.span>
                )}
              </div>
              <span className={cn(
                "text-[10px]",
                active ? "text-red-600" : "text-gray-600"
              )}>
                {link.label}
              </span>
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-red-600 rounded-full"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
