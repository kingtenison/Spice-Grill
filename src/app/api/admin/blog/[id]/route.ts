import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const body = await request.json();
  const { id } = await params;

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
    status,
  } = body;

  try {
    // Generate slug if not provided
    const finalSlug = slug || generateSlug(title);

    // Check slug uniqueness (exclude current post)
    const { data: existing } = await supabase
      .from("blogs")
      .select("id")
      .eq("slug", finalSlug)
      .neq("id", id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 400 }
      );
    }

    // Update blog post
    const updateData: any = {
      title,
      slug: finalSlug,
      content: content || "",
      excerpt: excerpt || "",
      featured_image_url: featured_image_url || null,
      meta_title: meta_title || title,
      meta_description: meta_description || excerpt || "",
      category_id: category_ids[0] || null, // Primary category
      status,
    };

    // Set published_at if status changes to published
    if (status === "published") {
      const { data: currentPost } = await supabase
        .from("blogs")
        .select("published_at")
        .eq("id", id)
        .single();

      if (!currentPost?.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    } else {
      updateData.published_at = null;
    }

    const { data: post, error: postError } = await supabase
      .from("blogs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (postError) throw postError;

    // Attach taxonomy (categories & tags)
    await attachTaxonomy(supabase, id, category_ids, tag_ids);

    // Fetch complete post with relations
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
      categories: fullPost?.categories ? [fullPost.categories] : [], // Wrap single category in array
      tags: fullPost?.blog_tags?.map((bt: any) => bt.tags).filter(Boolean) || [],
    };

    return NextResponse.json({ post: formattedPost });
  } catch (error: any) {
    console.error("Error updating blog post:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  try {
    // Delete blog tags first (cascade should handle, but be explicit)
    await supabase.from("blog_tags").delete().eq("blog_id", id);

    // Delete the post
    const { error } = await supabase.from("blogs").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function attachTaxonomy(
  supabase: any,
  blogId: string,
  categoryIds: string[],
  tagIds: string[]
) {
  // Remove existing tag relations
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
