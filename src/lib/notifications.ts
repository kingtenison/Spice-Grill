"use client";

import { toast } from "sonner";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: "order" | "status" | "alert" | "system";
  link?: string;
}

const NOTIFICATIONS_STORAGE_KEY = "spice_grill_notifications";
const SOUND_ENABLED_KEY = "spice_grill_sound_enabled";

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudioContext) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      sharedAudioContext = new AudioCtx();
    }
  }
  if (sharedAudioContext && sharedAudioContext.state === "suspended") {
    sharedAudioContext.resume().catch(() => {});
  }
  return sharedAudioContext;
}

if (typeof window !== "undefined") {
  const unlockAudio = () => {
    getAudioContext();
  };
  window.addEventListener("click", unlockAudio, { once: true, passive: true });
  window.addEventListener("keydown", unlockAudio, { once: true, passive: true });
  window.addEventListener("touchstart", unlockAudio, { once: true, passive: true });
}

/**
 * Synthesizes a loud, crisp, pleasant restaurant bell chime using Web Audio API.
 * Requires zero audio file downloads, works offline, and executes instantly.
 */
export function playNotificationSound(type: "new_order" | "status_change" | "alert" = "new_order"): void {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === "new_order") {
      // 🛎️ Restaurant Order Bell Chime (Dual harmonic bell: D5 -> A5)
      // Note 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.exponentialRampToValueAtTime(580, now + 0.4);

      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.7, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.5);

      // Note 2 (High chime): 880 Hz (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(870, now + 0.7);

      gain2.gain.setValueAtTime(0, now + 0.15);
      gain2.gain.linearRampToValueAtTime(0.85, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.15);
      osc2.stop(now + 0.85);

      // Overtone shimmer (1760 Hz)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = "triangle";
      osc3.frequency.setValueAtTime(1760, now + 0.16);

      gain3.gain.setValueAtTime(0, now + 0.16);
      gain3.gain.linearRampToValueAtTime(0.25, now + 0.19);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc3.connect(gain3);
      gain3.connect(ctx.destination);

      osc3.start(now + 0.16);
      osc3.stop(now + 0.7);
    } else if (type === "status_change") {
      // Gentle confirmation chime (C5 -> E5)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } else {
      // Alert / warning tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(392, now + 0.15);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch (err) {
    console.warn("Could not play notification sound:", err);
  }
}

/**
 * Checks if sound effects are enabled
 */
export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(SOUND_ENABLED_KEY);
  return stored === null ? true : stored === "true";
}

/**
 * Toggle or set sound alerts enabled
 */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SOUND_ENABLED_KEY, enabled ? "true" : "false");
}

/**
 * Request OS / Desktop / Mobile browser notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return "denied";
  }
}

/**
 * Returns current permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
}

/**
 * Sends an OS / Desktop browser push notification
 */
export function sendBrowserNotification(title: string, options?: NotificationOptions): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;

  try {
    const notif = new Notification(title, {
      icon: "/Spice_Logo.jpg",
      badge: "/Spice_Logo.jpg",
      ...options,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    return true;
  } catch (err) {
    console.warn("Browser notification failed:", err);
    return false;
  }
}

/**
 * Load notifications from localStorage
 */
export function getStoredNotifications(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save notification to localStorage and dispatch custom event for instant reactivity
 */
export function saveNotification(notification: Omit<AppNotification, "id" | "timestamp" | "read"> & { id?: string; timestamp?: string }): AppNotification {
  const fullItem: AppNotification = {
    id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: notification.timestamp || new Date().toISOString(),
    read: false,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    link: notification.link,
  };

  if (typeof window !== "undefined") {
    try {
      const current = getStoredNotifications();
      // Keep most recent 50 notifications
      const updated = [fullItem, ...current.filter(n => n.id !== fullItem.id)].slice(0, 50);
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("spice_notification_updated"));
    } catch (e) {
      console.warn("Failed to store notification:", e);
    }
  }

  return fullItem;
}

/**
 * Mark a single notification as read
 */
export function markNotificationAsRead(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredNotifications();
    const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("spice_notification_updated"));
  } catch (e) {
    console.warn(e);
  }
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsAsRead(): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredNotifications();
    const updated = current.map(n => ({ ...n, read: true }));
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("spice_notification_updated"));
  } catch (e) {
    console.warn(e);
  }
}

/**
 * Clear all notifications
 */
export function clearAllNotifications(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("spice_notification_updated"));
  } catch (e) {
    console.warn(e);
  }
}

/**
 * Trigger full system alert: sound + toast + desktop notification + store
 */
export function notifyNewOrder(order: { id: string; total_amount?: number; customer_name?: string }): void {
  const shortId = order.id.slice(-5).toUpperCase();
  const amountStr = order.total_amount ? ` ($${order.total_amount.toFixed(2)})` : "";
  const customerStr = order.customer_name ? ` from ${order.customer_name}` : "";

  const title = `🔔 New Order #${shortId}!`;
  const message = `Order #${shortId}${amountStr}${customerStr} received and ready for review.`;

  // 1. Audio chime
  playNotificationSound("new_order");

  // 2. Visual toast
  toast.success(title, {
    description: message,
    duration: 8000,
  });

  // 3. Desktop / OS notification
  sendBrowserNotification(title, {
    body: message,
    tag: `order-${order.id}`,
  });

  // 4. Save to notification center
  saveNotification({
    title,
    message,
    type: "order",
    link: "/admin/orders",
  });
}
