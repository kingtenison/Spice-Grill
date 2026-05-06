"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  X,
  Save,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Hash,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { BlogEditor } from "@/components/admin/RichTextEditor";
import { TaxonomySelector } from "@/components/admin/TaxonomySelector";
import { FeaturedImageUpload } from "@/components/admin/FeaturedImageUpload";

interface Category {
  id: string;
  name: string;
  slug: string;
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
  content: string;
  excerpt: string;
  status: "draft" | "published";
  featured_image_url?: string;
  meta_title?: string;
  meta_description?: string;
  published_at?: string;
  created_at?: string;
  categories: Category[];
  tags: Tag[];
}

interface PostFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image_url: string | null;
  meta_title: string;
  meta_description: string;
  category_ids: string[];
  tag_ids: string[];
  status: "draft" | "published";
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [formData, setFormData] = useState<PostFormData>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    featured_image_url: null,
    meta_title: "",
    meta_description: "",
    category_ids: [],
    tag_ids: [],
    status: "draft",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [postsRes, catsRes, tagsRes] = await Promise.all([
        fetch("/api/admin/blog?include=taxonomy"),
        fetch("/api/admin/categories"),
        fetch("/api/admin/tags"),
      ]);

      const [postsData, catsData, tagsData] = await Promise.all([
        postsRes.json(),
        catsRes.json(),
        tagsRes.json(),
      ]);

      setPosts(postsData.posts || []);
      setCategories(catsData.categories || []);
      setTags(tagsData.tags || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
      meta_title: title,
      ...(!prev.meta_description && { meta_description: "" }),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        featured_image_url: formData.featured_image_url || null,
      };

      const url = editingPost ? `/api/admin/blog/${editingPost.id}` : "/api/admin/blog";
      const method = editingPost ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (editingPost) {
          setPosts(posts.map((p) => (p.id === data.post.id ? data.post : p)));
        } else {
          setPosts([data.post, ...posts]);
        }
        closeModal();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to save post"}`);
      }
    } catch (error) {
      console.error("Error saving post:", error);
      alert("Failed to save post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPosts(posts.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleCreateTag = async (name: string) => {
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = await res.json();
        setTags([...tags, data.tag]);
      }
    } catch (error) {
      console.error("Error creating tag:", error);
    }
  };

  const openEditModal = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || "",
      featured_image_url: post.featured_image_url || null,
      meta_title: post.meta_title || post.title,
      meta_description: post.meta_description || "",
      category_ids: post.categories.map((c) => c.id),
      tag_ids: post.tags.map((t) => t.id),
      status: post.status,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPost(null);
    setPreviewMode(false);
    setFormData({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      featured_image_url: null,
      meta_title: "",
      meta_description: "",
      category_ids: [],
      tag_ids: [],
      status: "draft",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold mb-1 text-gray-900">Blog Management</h1>
          <p className="text-gray-600">Create and manage your restaurant&apos;s stories with our powerful editor.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-bold shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all"
        >
          <Plus className="w-5 h-5" />
          New Post
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-gray-600 mb-2">Total Posts</p>
          <h3 className="text-2xl font-black text-gray-900">{loading ? "—" : posts.length}</h3>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-gray-600 mb-2">Published</p>
          <h3 className="text-2xl font-black text-green-600">
            {loading ? "—" : posts.filter((p) => p.status === "published").length}
          </h3>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-gray-600 mb-2">Drafts</p>
          <h3 className="text-2xl font-black text-orange-600">
            {loading ? "—" : posts.filter((p) => p.status === "draft").length}
          </h3>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-gray-600 mb-2">Total Views</p>
          <h3 className="text-2xl font-black text-gray-900">12.4K</h3>
        </div>
      </div>

      {/* Posts Table */}
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <th className="px-6 py-5">Title</th>
              <th className="px-6 py-5">Category</th>
              <th className="px-6 py-5">Tags</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5">Date</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded" />
                    ))}
                  </div>
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-red-50 rounded-full">
                      <EyeOff className="w-8 h-8 text-red-400" />
                    </div>
                    <p className="text-gray-500">No blog posts yet. Create your first story!</p>
                  </div>
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="max-w-md">
                      <p className="font-bold text-sm group-hover:text-red-600 transition-colors text-gray-900">
                        {post.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{post.excerpt}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1">
                      {post.categories.slice(0, 2).map((cat) => (
                        <span
                          key={cat.id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600"
                        >
                          {cat.name}
                        </span>
                      ))}
                      {post.categories.length > 2 && (
                        <span className="text-[10px] text-gray-500">+{post.categories.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600"
                          style={tag.color ? { backgroundColor: `${tag.color}20`, color: tag.color } : {}}
                        >
                          <Hash className="w-2.5 h-2.5" />
                          {tag.name}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="text-[10px] text-gray-500">+{post.tags.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <button
                      onClick={async () => {
                        const newStatus = post.status === "published" ? "draft" : "published";
                        try {
                          const res = await fetch(`/api/admin/blog/${post.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: newStatus }),
                          });
                          if (res.ok) {
                            setPosts(posts.map((p) => (p.id === post.id ? { ...p, status: newStatus } : p)));
                          }
                        } catch (error) {
                          console.error("Error updating status:", error);
                        }
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer",
                        post.status === "published"
                          ? "bg-green-100 text-green-600 hover:bg-green-200"
                          : "bg-orange-100 text-orange-600 hover:bg-orange-200"
                      )}
                    >
                      {post.status === "published" ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3" />
                      )}
                      {post.status === "published" ? "Live" : "Draft"}
                    </button>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs text-gray-500 font-medium">
                      {new Date(post.published_at || post.created_at || new Date()).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                        className="p-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all"
                        title="View"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(post)}
                        className="p-2 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-all"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all"
                        title="Delete"
                      >
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

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 md:p-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-5xl mx-auto overflow-hidden"
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-gray-900">
                    {editingPost ? "Edit Post" : "Create New Post"}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewMode(!previewMode)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        previewMode
                          ? "bg-red-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {previewMode ? "Edit" : "Preview"}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="px-8 py-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                {previewMode ? (
                  /* Preview Mode */
                  <div className="prose prose-lg max-w-none">
                    {formData.featured_image_url && (
                      <img
                        src={formData.featured_image_url}
                        alt={formData.title}
                        className="w-full h-64 object-cover rounded-2xl mb-8"
                      />
                    )}
                    <h1 className="text-4xl font-black mb-4 text-gray-900">{formData.title}</h1>
                    <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-200">
                      <div className="flex flex-wrap gap-2">
                        {categories
                          .filter((c) => formData.category_ids.includes(c.id))
                          .map((cat) => (
                            <span
                              key={cat.id}
                              className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold uppercase rounded-full"
                            >
                              {cat.name}
                            </span>
                          ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {tags
                          .filter((t) => formData.tag_ids.includes(t.id))
                          .map((tag) => (
                            <span
                              key={tag.id}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded"
                            >
                              #{tag.name}
                            </span>
                          ))}
                      </div>
                    </div>
                    <div
                      className="[&_img]:rounded-xl [&_img]:max-w-full [&_h1]:text-gray-900 [&_h2]:text-gray-900 [&_p]:text-gray-700"
                      dangerouslySetInnerHTML={{ __html: formData.content }}
                    />
                    {formData.excerpt && (
                      <div className="mt-8 p-4 bg-red-50 rounded-xl border-l-4 border-red-600">
                        <p className="text-sm italic text-gray-600">Excerpt: {formData.excerpt}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Edit Mode */
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="lg:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                          Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          placeholder="Enter post title"
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none text-lg font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                          Slug
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/blog/</span>
                          <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                            placeholder="url-friendly-slug"
                            className="w-full pl-20 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as "draft" | "published" }))}
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none font-bold"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                    </div>

                    {/* Rich Text Editor */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                        Content *
                      </label>
                      <BlogEditor content={formData.content} onChange={(content) => setFormData((prev) => ({ ...prev, content }))} />
                    </div>

                    {/* Featured Image */}
                    <FeaturedImageUpload
                      value={formData.featured_image_url}
                      onChange={(url) => setFormData((prev) => ({ ...prev, featured_image_url: url }))}
                    />

                    {/* Taxonomy */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <TaxonomySelector
                        label="Categories"
                        description="Select one or more categories for this post"
                        selected={formData.category_ids}
                        available={categories}
                        onChange={(category_ids) => setFormData((prev) => ({ ...prev, category_ids }))}
                      />

                      <TaxonomySelector
                        label="Tags"
                        description="Add tags to help readers discover your content"
                        selected={formData.tag_ids}
                        available={tags}
                        onChange={(tag_ids) => setFormData((prev) => ({ ...prev, tag_ids }))}
                        onCreate={handleCreateTag}
                        allowCreate
                      />
                    </div>

                    {/* Excerpt */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                        Excerpt
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        A short summary that appears in blog listings and social shares
                      </p>
                      <textarea
                        value={formData.excerpt}
                        onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                        placeholder="Brief description of the post..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none resize-none text-sm"
                      />
                    </div>

                    {/* SEO Settings */}
                    <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">SEO Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                            Meta Title
                          </label>
                          <input
                            type="text"
                            value={formData.meta_title}
                            onChange={(e) => setFormData((prev) => ({ ...prev, meta_title: e.target.value }))}
                            placeholder="SEO title (defaults to post title)"
                            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                            Meta Description
                          </label>
                          <textarea
                            value={formData.meta_description}
                            onChange={(e) => setFormData((prev) => ({ ...prev, meta_description: e.target.value }))}
                            placeholder="Brief description for search engines..."
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none resize-none text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting || !formData.title.trim()}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl bg-red-600 text-white font-bold shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white rounded-full border-t-transparent" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            {editingPost ? "Update Post" : "Publish"}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
