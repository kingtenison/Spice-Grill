import { getServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET() {
  const db = getServiceClient();
  
  const { data: orders, error } = await db
    .from("orders")
    .select(`id, total_amount, status, created_at, profiles!inner(full_name)`)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    orders: orders ?? [],
  });
}