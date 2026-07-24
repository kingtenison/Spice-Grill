import { getServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const db = getServiceClient();
  const { searchParams } = new URL(request.url);
  const dispatcherId = searchParams.get("dispatcher_id");

  if (!dispatcherId) {
    return NextResponse.json({ error: "dispatcher_id is required" }, { status: 400 });
  }

  const { data, error } = await db
    .from("dispatcher_bank_accounts")
    .select("id, dispatcher_id, routing_number, account_last_four, is_verified, created_at, updated_at")
    .eq("dispatcher_id", dispatcherId)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || null);
}

export async function POST(request: NextRequest) {
  const db = getServiceClient();
  const body = await request.json();
  const { dispatcher_id, routing_number, account_number } = body;

  if (!dispatcher_id || !routing_number || !account_number) {
    return NextResponse.json({ error: "dispatcher_id, routing_number, and account_number are required" }, { status: 400 });
  }

  const account_last_four = account_number.slice(-4);

  // Check if exists
  const { data: existing } = await db
    .from("dispatcher_bank_accounts")
    .select("id")
    .eq("dispatcher_id", dispatcher_id)
    .single();

  if (existing) {
    const { error } = await db
      .from("dispatcher_bank_accounts")
      .update({
        routing_number,
        account_number_encrypted: account_number,
        account_last_four,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await db.from("dispatcher_bank_accounts").insert({
      dispatcher_id,
      routing_number,
      account_number_encrypted: account_number,
      account_last_four,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
