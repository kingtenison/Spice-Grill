import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET() {
  const db = getServiceClient();

  const { data: reviews, error } = await db
    .from("reviews")
    .select(`*, profiles(full_name)`)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    reviews: reviews ?? [],
  });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const db = getServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "employee"].includes(profile.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { id, is_published } = await request.json();
    if (!id || typeof is_published !== "boolean") {
      return NextResponse.json({ error: "Missing review id or is_published state" }, { status: 400 });
    }

    const { error: updateError } = await db
      .from("reviews")
      .update({ is_published })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Review ${is_published ? "approved" : "unpublished"}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update review" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const db = getServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "employee"].includes(profile.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing review id" }, { status: 400 });
    }

    const { error: deleteError } = await db
      .from("reviews")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Review deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete review" }, { status: 500 });
  }
}

