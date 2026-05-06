"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowRight, Clock, Tag } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

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
  featured_image_url: string | null;
  created_at: string;
  categories?: { id: string; name: string; slug: string }[];
  tags?: Tag[];
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function fetchPosts() {
      try {
        const { data, error } = await supabase
          .from('blogs')
          .select(`
            *,
            categories:category_id (id, name, slug),
            blog_tags(
              tag_id,
              tags:tag_id (id, name, slug, color)
            )
          `)
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (data && isMounted) {
          const formattedPosts = data.map((post: any) => ({
            ...post,
            tags: post.blog_tags?.map((bt: any) => bt.tags).filter(Boolean) || [],
          }));
          setPosts(formattedPosts);
        }
      } catch (error) {
        console.error("Error fetching blog posts:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchPosts();

    return () => { isMounted = false };
  }, []);

  const getImageUrl = (post: BlogPost) => {
    return post.featured_image_url || `https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?q=80&w=800&h=500&fit=crop`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="container px-4 pt-24 pb-20 mx-auto">
        <div className="max-w-3xl mb-16">
          <h1 className="text-5xl font-extrabold mb-6 text-gray-900">Our Stories</h1>
          <p className="text-xl text-gray-600">
            Explore the culinary journey, recipes, and news from the Spice Grill kitchen.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-96 rounded-2xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <>
            {/* Featured Post */}
            <Link
              href={`/blog/${posts[0].slug}`}
              className="group block relative rounded-2xl overflow-hidden bg-white border border-gray-200 mb-12 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="aspect-[4/3] lg:aspect-auto overflow-hidden">
                  <img
                    src={getImageUrl(posts[0])}
                    alt={posts[0].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-6 flex-wrap">
                    {posts[0].categories?.[0] && (
                      <span className="px-4 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider">
                        {posts[0].categories[0].name}
                      </span>
                    )}
                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 5 min read
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-extrabold mb-6 leading-tight group-hover:text-red-600 transition-colors text-gray-900">
                    {posts[0].title}
                  </h2>
                  <p className="text-lg text-gray-600 mb-8 line-clamp-3">
                    {posts[0].excerpt || "Discover the latest from Spice Grill."}
                  </p>
                  {posts[0].tags && posts[0].tags.length > 0 && (
                    <div className="flex items-center gap-2 mb-6">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <div className="flex flex-wrap gap-1">
                        {posts[0].tags.slice(0, 3).map((tag: any) => (
                          <span key={tag.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-600">S</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Spice Grill Team</p>
                        <p className="text-xs text-gray-500">{formatDate(posts[0].created_at)}</p>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center group-hover:bg-red-700 transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Blog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {posts.slice(1).map((post: any) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col rounded-2xl bg-white border border-gray-200 hover:border-red-600/30 transition-all hover:shadow-lg"
                >
                  <div className="aspect-[16/10] rounded-t-2xl overflow-hidden">
                    <img
                      src={getImageUrl(post)}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-3 mb-4">
                      {post.categories?.[0] && (
                        <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                          {post.categories[0].name}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 font-medium">5 min read</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-red-600 transition-colors text-gray-900 leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-grow">
                      {post.excerpt || "Read more about this story from our kitchen."}
                    </p>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {post.tags.slice(0, 2).map((tag: any) => (
                          <span key={tag.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                      <span className="text-xs text-gray-500">{formatDate(post.created_at)}</span>
                      <ArrowRight className="w-4 h-4 text-red-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">No stories yet</h3>
            <p className="text-gray-600">Check back soon for the latest from Spice Grill.</p>
          </div>
        )}
      </main>
    </div>
  );
}