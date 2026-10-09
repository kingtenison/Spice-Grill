"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  CheckCheck, 
  Trash2, 
  X, 
  ShoppingBag, 
  AlertCircle, 
  Info, 
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { 
  AppNotification, 
  getStoredNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  clearAllNotifications, 
  playNotificationSound, 
  isSoundEnabled, 
  setSoundEnabled,
  requestNotificationPermission,
  getNotificationPermission,
  notifyNewOrder,
  saveNotification
} from "@/lib/notifications";
import { createAuthClientBrowser } from "@/lib/supabase/client";

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load notifications and permissions
  useEffect(() => {
    setNotifications(getStoredNotifications());
    setSoundOn(isSoundEnabled());
    setPermission(getNotificationPermission());

    const handleUpdate = () => {
      setNotifications(getStoredNotifications());
    };

    window.addEventListener("spice_notification_updated", handleUpdate);

    // Close on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("spice_notification_updated", handleUpdate);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Set up real-time listener for incoming orders and updates
  useEffect(() => {
    const supabase = createAuthClientBrowser();

    const channel = supabase
      .channel("admin-notification-center")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload: any) => {
          const order = payload.new;
          if (order) {
            notifyNewOrder({
              id: order.id,
              total_amount: order.total_amount,
              customer_name: order.delivery_address ? "Customer" : undefined,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload: any) => {
          const order = payload.new;
          const oldOrder = payload.old;
          if (order && oldOrder && order.status !== oldOrder.status) {
            const shortId = order.id.slice(-5).toUpperCase();
            const title = `Order #${shortId} status changed to ${order.status.replace("_", " ")}`;
            const message = `Order total: $${order.total_amount?.toFixed(2) || "0.00"}`;
            
            playNotificationSound("status_change");
            saveNotification({
              title,
              message,
              type: order.status === "cancelled" ? "alert" : "status",
              link: "/admin/orders",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      playNotificationSound("new_order");
    }
  };

  const handleTestChime = () => {
    playNotificationSound("new_order");
  };

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSecs < 60) return "Just now";
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
      if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
      return date.toLocaleDateString();
    } catch {
      return "";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open notifications"
        className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-700 transition-all flex items-center justify-center cursor-pointer"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full mt-2 w-[calc(100vw-1rem)] sm:w-96 max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-base">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsAsRead}
                  title="Mark all as read"
                  className="p-1.5 text-xs text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-200/60 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Sound & Permission Bar */}
          <div className="px-4 py-2.5 bg-amber-50/50 border-b border-amber-100/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleSound}
                className="flex items-center gap-1.5 font-semibold text-gray-700 hover:text-red-600 cursor-pointer"
              >
                {soundOn ? (
                  <>
                    <Volume2 className="w-4 h-4 text-green-600" />
                    <span>Chime: On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Chime: Off</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleTestChime}
                className="px-2 py-0.5 bg-white border border-gray-200 rounded-md font-medium text-gray-600 hover:text-red-600 hover:border-red-300 transition-colors cursor-pointer"
              >
                🔊 Test Chime
              </button>
            </div>

            {permission !== "granted" && (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
              >
                Enable Desktop Alerts
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-gray-900 mb-1">No notifications yet</p>
                <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">
                  When new orders or updates arrive, you will hear a chime and see them right here.
                </p>
                <button
                  type="button"
                  onClick={handleTestChime}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-sm"
                >
                  Test Sound Chime
                </button>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markNotificationAsRead(item.id)}
                  className={`p-3.5 hover:bg-gray-50 transition-colors flex gap-3 items-start cursor-pointer ${!item.read ? "bg-red-50/30" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    item.type === "order" ? "bg-green-100 text-green-700" :
                    item.type === "alert" ? "bg-red-100 text-red-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {item.type === "order" ? (
                      <ShoppingBag className="w-4 h-4" />
                    ) : item.type === "alert" ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : (
                      <Info className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={`text-xs font-bold truncate ${!item.read ? "text-gray-900" : "text-gray-700"}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-1.5 leading-relaxed">
                      {item.message}
                    </p>
                    {item.link && (
                      <Link
                        href={item.link}
                        onClick={() => {
                          markNotificationAsRead(item.id);
                          setIsOpen(false);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700"
                      >
                        <span>View Order</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-red-600 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={clearAllNotifications}
                className="text-gray-500 hover:text-red-600 flex items-center gap-1 font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear all</span>
              </button>
              <Link
                href="/admin/orders"
                onClick={() => setIsOpen(false)}
                className="font-bold text-red-600 hover:text-red-700"
              >
                Open Orders →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
