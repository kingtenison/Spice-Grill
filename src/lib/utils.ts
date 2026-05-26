import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely extracts the first valid image URL from a menu item.
 * Handles:
 * - items.images (array)
 * - items.image_url as string
 * - items.image_url as JSON stringified array (current DB hack for multi-image)
 */
export function getMenuItemImage(item: any): string {
  const FALLBACK =
    'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&h=400&fit=crop';

  if (!item) return FALLBACK;

  // 1. Prefer explicit images array (best case)
  if (Array.isArray(item.images) && item.images.length > 0) {
    const valid = item.images.find(
      (img: any) =>
        typeof img === 'string' &&
        img.startsWith('http') &&
        !img.includes('undefined') &&
        !img.includes('null')
    );
    if (valid) return valid;
  }

  // 2. Handle image_url column (frequently contains JSON.stringify([...]) )
  const raw = item.image_url;
  if (raw != null) {
    if (Array.isArray(raw)) {
      const valid = raw.find(
        (img: any) => typeof img === 'string' && img.startsWith('http')
      );
      if (valid) return valid;
    }

    if (typeof raw === 'string') {
      const trimmed = raw.trim();

      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = parsed.find(
              (img: any) => typeof img === 'string' && img.startsWith('http')
            );
            if (valid) return valid;
            if (typeof parsed[0] === 'string') return parsed[0];
          }
        } catch {
          // not valid JSON, fall through
        }
      }

      if (trimmed.startsWith('http')) {
        return trimmed;
      }
    }
  }

  return FALLBACK;
}
