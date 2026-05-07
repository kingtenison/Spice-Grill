"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Clock, Share2, Link2, User, Tag } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featured_image_url: string | null;
  created_at: string;
  categories?: { id: string; name: string; slug: string }[];
  tags?: Tag[];
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
          .select(`
            *,
            categories:category_id (id, name, slug),
            blog_tags(
              tag_id,
              tags:tag_id (id, name, slug, color)
            )
          `)
          .eq('slug', slug)
          .eq('status', 'published')
          .single();

        if (fetchError) {
          console.error("Error fetching blog post:", fetchError);
        } else if (data) {
          const formattedPost = {
            ...data,
            tags: data.blog_tags?.map((bt: any) => bt.tags).filter(Boolean) || [],
          };
          setPost(formattedPost);
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
        <main className="container px-4 py-20 mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-8">The article you're looking for doesn't exist.</p>
          <Link href="/blog" className="text-red-600 font-semibold hover:underline">
            ← Back to Blog
          </Link>
        </main>
      </div>
    );
  }

  const getImageUrl = () => {
    return post.featured_image_url || `https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?q=80&w=1200&h=600&fit=crop`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-white pb-16">

      {/* Article Header */}
      <header className="container px-4 py-12 mx-auto max-w-4xl">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-red-600 mb-12 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {post.categories?.[0] && (
            <span className="px-4 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider">
              {post.categories[0].name}
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
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Spice Grill Team</p>
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
      {post.featured_image_url && (
        <div className="container px-4 mx-auto max-w-6xl mb-16">
          <div className="aspect-[21/9] rounded-2xl overflow-hidden shadow-xl">
            <img src={post.featured_image_url} alt={post.title} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Article Content */}
      <article className="container px-4 mx-auto max-w-3xl">
        {post.tags && post.tags.length > 0 && (
          <div className="flex items-center gap-2 mb-8 pb-8 border-b border-gray-200">
            <Tag className="w-4 h-4 text-gray-400" />
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div
          className="prose prose-lg max-w-none [&_h1]:text-gray-900 [&_h2]:text-gray-900 [&_h3]:text-gray-900 [&_p]:text-gray-700 [&_a]:text-red-600 [&_a]:underline [&_blockquote]:border-l-red-600 [&_blockquote]:text-gray-600"
          dangerouslySetInnerHTML={{ __html: post.content || "" }}
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