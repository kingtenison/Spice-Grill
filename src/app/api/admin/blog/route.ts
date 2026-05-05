import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data: posts, error } = await supabase
    .from("blogs")
    .select(`*`)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ posts: [] });
  }

  return NextResponse.json({
    posts: posts ?? [],
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { title, slug, content, excerpt, category, status } = await request.json();

  const { data: post, error } = await supabase
    .from("blogs")
    .insert([{ title, slug, content, excerpt, category, status }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post });
}