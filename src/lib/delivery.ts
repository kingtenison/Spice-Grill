// Delivery radius guard: the restaurant is in Moorhead, MN, and delivery is
// limited to a ~20 mile radius, which keeps all deliveries within the US.
export const MAX_DELIVERY_RADIUS_MILES = 20;

// Fallback restaurant coordinates (320 Red River Ave Ste D, Moorhead, MN)
export const DEFAULT_RESTAURANT_LAT = 46.8784346;
export const DEFAULT_RESTAURANT_LNG = -96.7425544;

export function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
