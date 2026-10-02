import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely extracts the first valid image URL from a menu item, cart item,
 * order item, or direct URL/array.
 * Handles:
 * - Direct image string URLs (with whitespace or quotes trimmed)
 * - JSON stringified arrays (e.g. '["/Fried Yam and Fish.jpg"]')
 * - items.image (standard cart item property)
 * - items.images (array)
 * - items.image_url (string, array, or JSON string)
 * - items.imageUrl
 * - Nested order items with menu_items (object or array)
 */
function isValidImageUrl(img: unknown): boolean {
  if (typeof img !== 'string') return false;
  const trimmed = img.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;
  return (
    (trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('/') ||
      trimmed.startsWith('data:image/')) &&
    !trimmed.includes('undefined') &&
    !trimmed.includes('null')
  );
}

function extractImageUrl(raw: unknown): string | null {
  if (!raw) return null;

  if (typeof raw === 'string') {
    let trimmed = raw.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        const extracted = extractImageUrl(parsed);
        if (extracted) return extracted;
      } catch {
        // Not valid JSON, continue with string handling
      }
    }
    trimmed = trimmed.replace(/^["']|["']$/g, '');
    if (isValidImageUrl(trimmed)) return trimmed;
  }

  if (Array.isArray(raw)) {
    for (const el of raw) {
      const url = extractImageUrl(el);
      if (url) return url;
    }
    return null;
  }

  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;

    // 1. Direct image properties in priority order
    const directProps = ['images', 'image', 'image_url', 'imageUrl', 'photo_url', 'thumbnail', 'avatar_url'];
    for (const prop of directProps) {
      if (obj[prop] != null) {
        const url = extractImageUrl(obj[prop]);
        if (url) return url;
      }
    }

    // 2. Nested relationships (e.g. order_item.menu_items or order_item.menu_item)
    const nestedProps = ['menu_items', 'menu_item', 'item'];
    for (const prop of nestedProps) {
      if (obj[prop] != null) {
        const url = extractImageUrl(obj[prop]);
        if (url) return url;
      }
    }
  }

  return null;
}

export function getMenuItemImage(item: unknown): string {
  const FALLBACK =
    'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&h=400&fit=crop';

  const extracted = extractImageUrl(item);
  return extracted || FALLBACK;
}

export function getMenuItemName(item: unknown, fallback = 'Menu Item'): string {
  if (!item) return fallback;
  if (typeof item === 'string') return item.trim() || fallback;
  if (Array.isArray(item) && item.length > 0) {
    return getMenuItemName(item[0], fallback);
  }
  if (typeof item === 'object') {
    const obj = item as Record<string, unknown>;
    if (typeof obj.name === 'string' && obj.name.trim()) {
      return obj.name.trim();
    }
    if (obj.menu_items != null) {
      return getMenuItemName(obj.menu_items, fallback);
    }
    if (obj.menu_item != null) {
      return getMenuItemName(obj.menu_item, fallback);
    }
    if (obj.item != null) {
      return getMenuItemName(obj.item, fallback);
    }
  }
  return fallback;
}

