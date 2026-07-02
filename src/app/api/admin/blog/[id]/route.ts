import { getServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getServiceClient();
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
    const finalSlug = slug || generateSlug(title);

    const { data: existing } = await db
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

    const updateData: any = {
      title,
      slug: finalSlug,
      content: content || "",
      excerpt: excerpt || "",
      featured_image_url: featured_image_url || null,
      meta_title: meta_title || title,
      meta_description: meta_description || excerpt || "",
      category_id: category_ids[0] || null,
      status,
    };

    if (status === "published") {
      const { data: currentPost } = await db
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

    const { data: post, error: postError } = await db
      .from("blogs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (postError) throw postError;

    await attachTaxonomy(db, id, category_ids, tag_ids);

    const { data: fullPost } = await db
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
      categories: fullPost?.categories ? [fullPost.categories] : [],
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
  const db = getServiceClient();
  const { id } = await params;

  try {
    await db.from("blog_tags").delete().eq("blog_id", id);

    const { error } = await db.from("blogs").delete().eq("id", id);

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
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function attachTaxonomy(
  db: any,
  blogId: string,
  categoryIds: string[],
  tagIds: string[]
) {
  return db.from("blog_tags").delete().eq("blog_id", blogId).then(() => {
    if (tagIds.length > 0) {
      const blogTags = tagIds.map((tagId: string) => ({
        blog_id: blogId,
        tag_id: tagId,
      }));
      return db.from("blog_tags").insert(blogTags);
    }
  });
}
