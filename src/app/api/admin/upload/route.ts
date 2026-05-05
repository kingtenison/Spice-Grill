import { createClient } from '@supabase/supabase-js';
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
   
    const formData = await request.formData();
    const file = formData.get("file") as File;
   
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Helper function to ensure bucket exists
    async function ensureBucketExists() {
      try {
        // First, try to get bucket info to see if it exists
        const { data: buckets, error: listError } = await supabase
          .storage
          .listBuckets();
          
        if (listError) throw listError;
        
        const bucketExists = buckets?.some(bucket => bucket.name === 'menu-images');
        if (bucketExists) {
          return true;
        }
        
        // Bucket doesn't exist, try to create it
        console.log("Bucket 'menu-images' not found, creating it...");
        const { data: bucketData, error: bucketError } = await supabase
          .storage
          .createBucket('menu-images', { public: true });
          
        if (bucketError) {
          console.error('Error creating bucket:', bucketError);
          throw bucketError;
        }
        
        console.log("Bucket 'menu-images' created successfully");
        return true;
      } catch (err) {
        console.error('Error in ensureBucketExists:', err);
        throw err;
      }
    }

    // Ensure bucket exists before upload
    await ensureBucketExists();

    // Upload the file
    const { data: uploadData, error } = await supabase
      .storage
      .from("menu-images")
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Construct public URL directly (more reliable than getPublicUrl)
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/menu-images/${fileName}`;

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error('Unexpected error in upload route:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}