import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type (images and videos)
    const isValidType = file.type.startsWith("image/") || file.type.startsWith("video/");
    if (!isValidType) {
      return NextResponse.json(
        { error: "File must be an image or video" },
        { status: 400 }
      );
    }

    // Determine file type
    const fileType = file.type.startsWith("image/") ? "image" : "video";

    // Generate unique filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${fileType}/${timestamp}-${safeName}`;

    // Ensure 'media' bucket exists
    await ensureBucketExists(supabase, "media");

    // Upload the file
    const { data: uploadData, error } = await supabase
      .storage
      .from("media")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("media")
      .getPublicUrl(fileName);

    // Save metadata to database
    const { data: mediaFile, error: dbError } = await supabase
      .from("media_files")
      .insert({
        url: publicUrlData.publicUrl,
        alt: null,
        type: fileType,
        size: file.size,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error saving media metadata:", dbError);
    }

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      type: fileType,
      name: file.name,
      size: file.size,
    });
  } catch (err: any) {
    console.error("Unexpected error in media upload:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function ensureBucketExists(supabase: any, bucketName: string) {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) throw listError;

    const bucketExists = buckets?.some((bucket: any) => bucket.name === bucketName);
    if (bucketExists) {
      return true;
    }

    console.log(`Bucket '${bucketName}' not found, creating it...`);
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket(
      bucketName,
      { public: true }
    );

    if (bucketError) {
      console.error("Error creating bucket:", bucketError);
      throw bucketError;
    }

    console.log(`Bucket '${bucketName}' created successfully`);
    return true;
  } catch (err) {
    console.error("Error in ensureBucketExists:", err);
    throw err;
  }
}
