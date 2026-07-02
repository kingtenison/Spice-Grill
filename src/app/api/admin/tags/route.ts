import { getServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET() {
  const db = getServiceClient();

  try {
    const { data: tags, error } = await db
      .from("tags")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ tags: tags ?? [] });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json({ tags: [] });
  }
}

export async function POST(request: Request) {
  const db = getServiceClient();
  const { name, description, color } = await request.json();

  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
  }

  const slug = generateSlug(name.trim());

  try {
    const { data: existing } = await db
      .from("tags")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "A tag with this name already exists" },
        { status: 400 }
      );
    }

    const { data: tag, error: tagError } = await db
      .from("tags")
      .insert({
        name: name.trim(),
        slug,
        description: description || null,
        color: color || "#DC2626",
      })
      .select()
      .single();

    if (tagError) throw tagError;

    return NextResponse.json({ tag });
  } catch (error: any) {
    console.error("Error creating tag:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const db = getServiceClient();
  const { id, name, description, color } = await request.json();

  if (!id || !name) {
    return NextResponse.json({ error: "ID and name are required" }, { status: 400 });
  }

  const slug = generateSlug(name.trim());

  try {
    const { data: existing } = await db
      .from("tags")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "A tag with this name already exists" },
        { status: 400 }
      );
    }

    const { data: tag, error: tagError } = await db
      .from("tags")
      .update({
        name: name.trim(),
        slug,
        description: description || null,
        color: color || "#DC2626",
      })
      .eq("id", id)
      .select()
      .single();

    if (tagError) throw tagError;

    return NextResponse.json({ tag });
  } catch (error: any) {
    console.error("Error updating tag:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const db = getServiceClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Tag ID is required" }, { status: 400 });
  }

  try {
    const { error } = await db.from("tags").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting tag:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
