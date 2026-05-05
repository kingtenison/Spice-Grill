"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowLeft, Clock, Share2, Link2, User } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  author: string | null;
  category: string | null;
  created_at: string;
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    const supabase = createClient();

    async function fetchPost() {
      setIsLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('blogs')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .single();

        if (fetchError) {
          console.error("Error fetching blog post:", fetchError);
        } else if (data) {
          setPost(data);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchPost();

    return () => { isMounted = false };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="container px-4 py-20 mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-gray-200 rounded" />
            <div className="h-12 w-full max-w-3xl bg-gray-200 rounded" />
            <div className="h-64 w-full bg-gray-200 rounded" />
          </div>
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="container px-4 py-20 mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-8">The article you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/blog" className="text-red-600 font-semibold hover:underline">
            ← Back to Blog
          </Link>
        </main>
      </div>
    );
  }

  const getImageUrl = () => {
    return post.image_url || `https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?q=80&w=1200&h=600&fit=crop`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Default content if no content exists
  const contentHtml = post.content || `
    <p className="text-lg leading-relaxed mb-6 text-gray-700">
      Discover the latest from Spice Grill. Our chefs are always creating something new and exciting.
    </p>
  `;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Navbar />

      {/* Article Header */}
      <header className="container px-4 py-12 mx-auto max-w-4xl">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-red-600 mb-12 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        <div className="flex items-center gap-3 mb-6">
          {post.category && (
            <span className="px-4 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider">
              {post.category}
            </span>
          )}
          <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" /> 5 min read
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold mb-8 leading-tight text-gray-900">
          {post.title}
        </h1>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-8 border-y border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{post.author || "Spice Grill Team"}</p>
              <p className="text-sm text-gray-500">{post.created_at ? formatDate(post.created_at) : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-3 rounded-xl bg-gray-100 hover:bg-red-600 hover:text-white transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
              <Link2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Article Image */}
      <div className="container px-4 mx-auto max-w-6xl mb-16">
        <div className="aspect-[21/9] rounded-2xl overflow-hidden shadow-xl">
          <img src={getImageUrl()} alt={post.title} className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Article Content */}
      <article className="container px-4 mx-auto max-w-3xl">
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {/* Share */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Share this article</h3>
              <p className="text-gray-600 text-sm">Spread the word about Spice Grill.</p>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-red-600 hover:text-white transition-colors font-medium">
                Twitter
              </button>
              <button className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-red-600 hover:text-white transition-colors font-medium">
                Facebook
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}