import { createClient } from '@supabase/supabase-js';
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: items, error } = await supabase
      .from("menu_items")
      .select(`*, categories(name)`)
      .order("created_at");

    if (error) {
      console.error('Error fetching menu items:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      items: items ?? [],
    });
  } catch (err) {
    console.error('Unexpected error in menu items GET route:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { name, description, price, category_id, image_url, is_available, stock_quantity } = await request.json();

    // Basic validation
    if (!name || !description || !price || !category_id || image_url === undefined || stock_quantity === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: item, error } = await supabase
      .from("menu_items")
      .insert([{ name, description, price, category_id, image_url, is_available, stock_quantity }])
      .select()
      .single();

    if (error) {
      console.error('Error creating menu item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item });
  } catch (err) {
    console.error('Unexpected error in menu items POST route:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}