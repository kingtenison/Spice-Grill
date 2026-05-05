import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data: campaigns, error } = await supabase
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

export async function POST(request: Request) {
  const supabase = await createClient();
  const { name, type, status, reach, performance } = await request.json();

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert([{ name, type, status, reach, performance }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campaign });
}