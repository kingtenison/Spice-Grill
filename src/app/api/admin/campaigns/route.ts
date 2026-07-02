import { getServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET() {
  const db = getServiceClient();

  const { data: campaigns, error } = await db
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ campaigns: [] });
  }

  return NextResponse.json({
    campaigns: campaigns ?? [],
  });
}
