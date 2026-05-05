"use client";

import { useEffect, useState } from "react";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ExternalLink,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  category?: string;
}

interface NewPostForm {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  status: string;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<NewPostForm>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    category: "",
    status: "draft",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/blog");
        const data = await res.json();
        setPosts(data.posts || []);
      } catch (error) {
        console.error("Error fetching blog posts:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts([data.post, ...posts]);
        setShowModal(false);
        setFormData({ title: "", slug: "", content: "", excerpt: "", category: "", status: "draft" });
      }
    } catch (error) {
      console.error("Error creating blog post:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold mb-1">Blog Management</h1>
          <p className="text-muted-foreground">Create and manage your restaurant&apos;s stories and news.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
        >
          <Plus className="w-5 h-5" /> New Post
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Total Posts</p>
          <h3 className="text-2xl font-black">{loading ? "—" : posts.length}</h3>
        </div>
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Total Views</p>
          <h3 className="text-2xl font-black">12.4K</h3>
        </div>
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Avg. Read Time</p>
          <h3 className="text-2xl font-black">4.5 min</h3>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-accent/50 border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <th className="px-6 py-5">Post Title</th>
              <th className="px-6 py-5">Author</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5">Date</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center">
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-accent rounded" />
                    ))}
                  </div>
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  No blog posts found. Create your first post!
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="hover:bg-accent/10 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="max-w-md">
                      <p className="font-bold text-sm group-hover:text-primary transition-colors">{post.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{post.category || "Uncategorized"}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold">Admin</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "text-[10px] font-black uppercase px-2 py-1 rounded-lg",
                      post.status?.toLowerCase() === "published" ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                    )}>
                      {post.status?.toLowerCase() === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs text-muted-foreground font-medium">{formatDate(post.created_at)}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all" title="View">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-all" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Create New Blog Post</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-accent">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Title</label>
                <input
                  type="text" required value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-accent border border-transparent focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Slug</label>
                <input
                  type="text" required value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-accent border border-transparent focus:border-primary outline-none"
                  placeholder="url-friendly-slug"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Content</label>
                <textarea
                  required value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-accent border border-transparent focus:border-primary outline-none resize-none" rows={4}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-accent border border-transparent focus:border-primary outline-none resize-none" rows={2}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Category</label>
                <input
                  type="text" value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-accent border border-transparent focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-accent border border-border font-bold outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border font-bold hover:bg-accent transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}