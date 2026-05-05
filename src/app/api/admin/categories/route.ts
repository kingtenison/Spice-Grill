import { createClient } from '@supabase/supabase-js';
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: categories, error } = await supabase
      .from("categories")
      .select(`*`)
      .order("name");

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      categories: categories ?? [],
    });
  } catch (err) {
    console.error('Unexpected error in categories route:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}