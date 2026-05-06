import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const includeTaxonomy = searchParams.has("include");

  try {
    let query = supabase
      .from("blogs")
      .select(`
        *,
        categories:category_id (id, name, slug),
        blog_tags(
          tag_id,
          tags:tag_id (id, name, slug, color)
        )
      `)
      .order("created_at", { ascending: false });

    // Filter by status if requested
    const status = searchParams.get("status");
    if (status) {
      query = query.eq("status", status);
    }

    const { data: posts, error } = await query;

    if (error) throw error;

    // Transform to include flat tags and categories arrays
    const formattedPosts = posts?.map((post: any) => ({
      ...post,
      categories: post.categories ? [post.categories] : [], // Wrap single category in array
      tags: post.blog_tags?.map((bt: any) => bt.tags).filter(Boolean) || [],
    }));

    return NextResponse.json({ posts: formattedPosts ?? [] });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json({ posts: [], error: "Failed to fetch posts" });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const {
    title,
    slug,
    content,
    excerpt,
    featured_image_url,
    meta_title,
    meta_description,
    category_ids = [],
    tag_ids = [],
    status = "draft",
    published_at,
  } = body;

  try {
    // Generate slug if not provided
    const finalSlug = slug || generateSlug(title);

    // Check slug uniqueness
    const { data: existing } = await supabase
      .from("blogs")
      .select("id")
      .eq("slug", finalSlug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 400 }
      );
    }

    // Insert blog post
    const { data: post, error: postError } = await supabase
      .from("blogs")
      .insert({
        title,
        slug: finalSlug,
        content: content || "",
        excerpt: excerpt || "",
        featured_image_url: featured_image_url || null,
        meta_title: meta_title || title,
        meta_description: meta_description || excerpt || "",
        category_id: category_ids[0] || null, // Primary category
        status,
        published_at: status === "published" ? (published_at || new Date().toISOString()) : null,
      })
      .select()
      .single();

    if (postError) throw postError;

    // Attach categories (through category_id) and tags
    if (category_ids.length > 0 || tag_ids.length > 0) {
      await attachTaxonomy(supabase, post.id, category_ids, tag_ids);
    }

    // Fetch the complete post with relations
    const { data: fullPost } = await supabase
      .from("blogs")
      .select(`
        *,
        categories:category_id (id, name, slug),
        blog_tags(
          tag_id,
          tags:tag_id (id, name, slug, color)
        )
      `)
      .eq("id", post.id)
      .single();

    const formattedPost = {
      ...fullPost,
      tags: fullPost?.blog_tags?.map((bt: any) => bt.tags).filter(Boolean) || [],
    };

    return NextResponse.json({ post: formattedPost });
  } catch (error: any) {
    console.error("Error creating blog post:", error);
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

async function attachTaxonomy(
  supabase: any,
  blogId: string,
  categoryIds: string[],
  tagIds: string[]
) {
  // Remove existing relations (for updates)
  await supabase.from("blog_tags").delete().eq("blog_id", blogId);

  // Insert new tag relations
  if (tagIds.length > 0) {
    const blogTags = tagIds.map((tagId) => ({
      blog_id: blogId,
      tag_id: tagId,
    }));
    await supabase.from("blog_tags").insert(blogTags);
  }
}
