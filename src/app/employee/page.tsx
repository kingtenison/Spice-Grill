"use client";

import { useState } from "react";
import { 
  Clock, 
  ChevronRight, 
  MapPin, 
  CheckCircle2,
  Clock4,
  Truck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const MOCK_ACTIVE_ORDERS = [
  { 
    id: "#ORD-7829", 
    customer: "Amara Okeke", 
    items: [
      { name: "Truffle Mushroom Pizza", quantity: 2 },
      { name: "Hibiscus Iced Tea", quantity: 1 }
    ],
    total: "$56.48",
    status: "Pending",
    timeReceived: "5 mins ago",
    address: "123 Victory Lane, Accra"
  },
  { 
    id: "#ORD-7828", 
    customer: "Kofi Mensah", 
    items: [
      { name: "Double Wagyu Burger", quantity: 1 }
    ],
    total: "$18.50",
    status: "Preparing",
    timeReceived: "12 mins ago",
    address: "45 Independence Ave, Osu"
  },
  { 
    id: "#ORD-7827", 
    customer: "Sarah Johnson", 
    items: [
      { name: "Quinoa Avocado Salad", quantity: 2 }
    ],
    total: "$28.00",
    status: "Ready",
    timeReceived: "18 mins ago",
    address: "99 Ring Road, Cantonments"
  }
];

export default function EmployeeDashboard() {
  const [orders, setOrders] = useState(MOCK_ACTIVE_ORDERS);

  const getStatusConfig = (status: string) => {
    switch(status) {
      case "Pending": return { icon: Clock4, color: "bg-orange-100 text-orange-600", next: "Accept Order" };
      case "Preparing": return { icon: ChefHat, color: "bg-blue-100 text-blue-600", next: "Mark as Ready" };
      case "Ready": return { icon: CheckCircle2, color: "bg-purple-100 text-purple-600", next: "Send for Delivery" };
      default: return { icon: Truck, color: "bg-green-100 text-green-600", next: "Complete" };
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Active Orders</h1>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-bold animate-pulse">
          <div className="w-2 h-2 rounded-full bg-green-600" />
          Live Connection Active
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <AnimatePresence>
          {orders.map((order) => {
            const config = getStatusConfig(order.status);
            return (
              <motion.div 
                layout
                key={order.id}
                className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-all group"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl font-black text-primary">{order.id}</span>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                        config.color
                      )}>
                        {order.status}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold">{order.customer}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <Clock className="w-4 h-4" /> Received {order.timeReceived}
                    </div>
                  </div>
                  <button className="p-3 rounded-2xl bg-accent hover:bg-primary hover:text-white transition-all">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                {/* Items List */}
                <div className="space-y-4 mb-8">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-accent/40 border border-transparent group-hover:border-border transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-black text-primary shadow-sm">
                          {item.quantity}
                        </div>
                        <span className="font-bold text-lg">{item.name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Info */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1 text-muted-foreground shrink-0" />
                    <p className="text-xs font-medium text-muted-foreground line-clamp-2">{order.address}</p>
                  </div>
                  <div className="flex items-center justify-end font-black text-xl">
                    {order.total}
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <button className="py-4 rounded-2xl bg-accent text-muted-foreground font-bold hover:bg-red-50 hover:text-red-500 transition-all">
                    Reject
                  </button>
                  <button className="py-4 rounded-2xl bg-primary text-primary-foreground font-black text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    {config.next}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {orders.length === 0 && (
        <div className="py-32 text-center">
          <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold text-muted-foreground">All caught up!</h3>
          <p className="text-muted-foreground mt-2">New orders will appear here automatically.</p>
        </div>
      )}
    </div>
  );
}

function ChefHat(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 18 6-6 6 6" />
      <path d="M12 2v10" />
      <path d="M17 18a2 2 0 0 0 0-4H7a2 2 0 0 0 0 4" />
      <path d="M6 14v4" />
      <path d="M18 14v4" />
    </svg>
  );
}
