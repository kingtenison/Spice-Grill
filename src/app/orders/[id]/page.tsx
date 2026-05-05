"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { 
  CheckCircle2, Clock, ChefHat, Truck, 
  Package, ArrowLeft, Phone 
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  status: string;
  total_amount: number;
}

interface OrderItem {
  id: string;
  quantity: number;
  subtotal: number;
  menu_items?: { name: string };
}

const STEPS = [
  { key: "pending", label: "Order Placed", icon: CheckCircle2 },
  { key: "confirmed", label: "Confirmed", icon: Clock },
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "ready", label: "Ready", icon: Package },
  { key: "delivered", label: "Delivered", icon: Truck },
];

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchOrder() {
      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderData) {
        setOrder(orderData);

        const { data: itemsData } = await supabase
          .from("order_items")
          .select("*, menu_items(name, image)")
          .eq("order_id", orderId);

        if (itemsData) setItems(itemsData);
      }
      setLoading(false);
    }

    fetchOrder();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase]);

  const currentStepIndex = order ? STEPS.findIndex((s) => s.key === order.status) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container px-4 py-20 mx-auto max-w-2xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-accent/30 rounded-xl w-1/3" />
            <div className="h-64 bg-accent/30 rounded-[2rem]" />
            <div className="h-48 bg-accent/30 rounded-[2rem]" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container px-4 py-20 mx-auto max-w-lg text-center">
          <h1 className="text-3xl font-black mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-8">We&apos;re couldn&apos;t find this order. Please check the link.</p>
          <Link href="/menu" className="inline-flex px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-extrabold">
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container px-4 py-12 mx-auto max-w-2xl">
        <Link href="/menu" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">Order Tracking</h1>
          <p className="text-xs font-bold text-primary uppercase tracking-widest">#{orderId.slice(0, 8)}</p>
        </div>

        {/* Progress Tracker */}
        <div className="p-8 rounded-[2.5rem] bg-card border border-border shadow-xl mb-8">
          <div className="flex items-center justify-between mb-10">
            {STEPS.map((step, i) => (
              <div key={step.key} className="flex flex-col items-center gap-2 relative flex-1">
                {i > 0 && (
                  <div className={cn(
                    "absolute top-5 right-1/2 w-full h-0.5",
                    i <= currentStepIndex ? "bg-primary" : "bg-accent"
                  )} />
                )}
                <div className={cn(
                  "relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  i <= currentStepIndex 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
                    : "bg-accent text-muted-foreground"
                )}>
                  <step.icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest text-center",
                  i <= currentStepIndex ? "text-primary" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          <div className="text-center p-6 rounded-2xl bg-accent/30">
            <p className="text-sm font-bold text-muted-foreground mb-1">Estimated Time</p>
            <p className="text-2xl font-black">25 - 35 min</p>
          </div>
        </div>

        {/* Order Items */}
        <div className="p-8 rounded-[2.5rem] bg-card border border-border shadow-sm mb-8">
          <h3 className="font-bold mb-6">Order Items</h3>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-black text-xs text-primary">
                    {item.quantity}x
                  </span>
                  <span className="font-bold text-sm">{item.menu_items?.name || "Menu Item"}</span>
                </div>
                <span className="font-extrabold">${item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-border flex justify-between">
            <span className="font-extrabold text-lg">Total</span>
            <span className="font-black text-lg text-primary">${order.total_amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Contact */}
        <div className="p-6 rounded-[2rem] bg-accent/30 border border-border flex items-center justify-between">
          <div>
            <p className="font-bold">Need help with your order?</p>
            <p className="text-sm text-muted-foreground">Contact the restaurant directly</p>
          </div>
          <a href="tel:+1234567890" className="p-4 rounded-2xl bg-primary text-primary-foreground hover:scale-105 transition-transform shadow-lg shadow-primary/20">
            <Phone className="w-5 h-5" />
          </a>
        </div>
      </main>
    </div>
  );
}
