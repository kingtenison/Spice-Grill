import { getServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET() {
  const db = getServiceClient();
  
  const { count, error } = await db
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "customer");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    count: count ?? 0,
  });
}