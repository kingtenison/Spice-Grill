import { getServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerLat = parseFloat(searchParams.get("lat") || "0");
  const customerLng = parseFloat(searchParams.get("lng") || "0");

  if (!customerLat || !customerLng) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const db = getServiceClient();
  const { data: settings } = await db
    .from("delivery_settings")
    .select("restaurant_lat, restaurant_lng")
    .limit(1)
    .single();

  const restaurantLat = settings?.restaurant_lat ?? 46.8772;
  const restaurantLng = settings?.restaurant_lng ?? -96.7898;

  const distanceMiles = haversineDistance(restaurantLat, restaurantLng, customerLat, customerLng);

  return NextResponse.json({
    distance_miles: Math.round(distanceMiles * 100) / 100,
    restaurant_lat: restaurantLat,
    restaurant_lng: restaurantLng,
  });
}
