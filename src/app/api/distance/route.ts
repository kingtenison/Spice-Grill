import { getServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_RESTAURANT_LAT,
  DEFAULT_RESTAURANT_LNG,
  haversineMiles,
} from "@/lib/delivery";

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

  const restaurantLat = Number(settings?.restaurant_lat) || DEFAULT_RESTAURANT_LAT;
  const restaurantLng = Number(settings?.restaurant_lng) || DEFAULT_RESTAURANT_LNG;

  const distanceMiles = haversineMiles(restaurantLat, restaurantLng, customerLat, customerLng);

  return NextResponse.json({
    distance_miles: Math.round(distanceMiles * 100) / 100,
    restaurant_lat: restaurantLat,
    restaurant_lng: restaurantLng,
  });
}
