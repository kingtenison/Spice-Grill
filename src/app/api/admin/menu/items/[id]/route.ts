import { createClient } from '@supabase/supabase-js';
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: item, error } = await supabase
      .from("menu_items")
      .select(`*, categories(name)`)
      .eq("id", id)
      .single();

    if (error) {
      console.error('Error fetching menu item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!item) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    // Parse image_url JSON string back to array
    const processedItem = {
      ...item,
      images: item.image_url ? (Array.isArray(item.image_url) ? item.image_url : JSON.parse(item.image_url)) : []
    };

    return NextResponse.json({ item: processedItem });
  } catch (err) {
    console.error('Unexpected error in menu item GET route:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { name, description, price, category_id, images, is_available, stock_quantity } = await request.json();

    // Basic validation
    if (!name || !description || !price || !category_id || !Array.isArray(images) || images.length === 0 || stock_quantity === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: item, error } = await supabase
      .from("menu_items")
      .update({ name, description, price, category_id, image_url: JSON.stringify(images), is_available, stock_quantity })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error('Error updating menu item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!item) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (err) {
    console.error('Unexpected error in menu item PUT route:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error('Error deleting menu item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unexpected error in menu item DELETE route:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}