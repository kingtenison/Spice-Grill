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

    // Parse image_url JSON strings back to arrays and ensure all fields are properly typed
    const processedItems = (items ?? []).map(item => {
      let images = [];
      if (item.image_url) {
        if (Array.isArray(item.image_url)) {
          images = item.image_url;
        } else if (typeof item.image_url === 'string') {
          try {
            images = JSON.parse(item.image_url);
          } catch {
            // If it's not valid JSON, assume it's a single URL string
            images = [item.image_url];
          }
        }
      }
      return {
        ...item,
        images,
        ingredients: item.ingredients || [],
        allergens: item.allergens || [],
        dietary_tags: item.dietary_tags || [],
        nutritional_info: item.nutritional_info || null
      };
    });

    return NextResponse.json({
      items: processedItems,
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

    const {
      name,
      description,
      price,
      category_id,
      images,
      is_available,
      stock_quantity,
      low_stock_threshold,
      ingredients,
      preparation_time,
      cooking_method,
      nutritional_info,
      allergens,
      dietary_tags,
      calories
    } = await request.json();

    // Basic validation
    if (!name || !description || !price || !category_id || !Array.isArray(images) || images.length === 0 || stock_quantity === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: item, error } = await supabase
      .from("menu_items")
      .insert([{
        name,
        description,
        price,
        category_id,
        image_url: JSON.stringify(images),
        is_available,
        stock_quantity,
        low_stock_threshold: low_stock_threshold || 10,
        ingredients: ingredients || [],
        preparation_time: preparation_time || null,
        cooking_method: cooking_method || null,
        nutritional_info: nutritional_info || null,
        allergens: allergens || [],
        dietary_tags: dietary_tags || [],
        calories: calories || null
      }])
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