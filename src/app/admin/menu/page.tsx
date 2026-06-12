"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  X,
  Search,
  Filter,
  MoreVertical,
  Upload,
  AlertTriangle,
  Package,
  Star,
  Clock,
  DollarSign,
  Grid3X3,
  List,
  Download,
  Upload as UploadIcon,
  ChevronDown,
  CheckSquare,
  Square,
  Copy,
  Move,
  QrCode
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MultiImageUpload } from "@/components/admin/MultiImageUpload";
import Link from "next/link";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  images?: string[];
  is_available: boolean;
  stock_quantity: number;
  category_id?: string;
  categories?: { name: string };
  created_at?: string;
  // Extended fields for detailed view
  ingredients?: string[];
  preparation_time?: number;
  cooking_method?: string;
  nutritional_info?: {
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  allergens?: string[];
  dietary_tags?: string[];
  calories?: number;
}

interface Category {
  id: string;
  name: string;
  item_count?: number;
}

interface NewItemForm {
  name: string;
  description: string;
  price: string;
  category_id: string;
  images: string[];
  stock_quantity: string;
  _files?: File[]; // Temporary property for file uploads
  is_available: boolean;
  // Extended fields
  ingredients: string;
  preparation_time: string;
  cooking_method: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  allergens: string;
  dietary_tags: string;
  calories: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'price' | 'stock' | 'created' | 'category';

export default function AdminMenuPage() {
  // State management
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Bulk operations
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Form state
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState<NewItemForm>({
    name: "",
    description: "",
    price: "",
    category_id: "",
    images: [],
    stock_quantity: "0",
    _files: [],
    is_available: true,
    ingredients: "",
    preparation_time: "",
    cooking_method: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
    allergens: "",
    dietary_tags: "",
    calories: "",
  });
  const [editFormData, setEditFormData] = useState<NewItemForm>({
    name: "",
    description: "",
    price: "",
    category_id: "",
    images: [],
    stock_quantity: "0",
    _files: [],
    is_available: true,
    ingredients: "",
    preparation_time: "",
    cooking_method: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
    allergens: "",
    dietary_tags: "",
    calories: "",
  });

  // Inline editing state
  const [inlineEditing, setInlineEditing] = useState<string | null>(null);
  const [inlineFormData, setInlineFormData] = useState<Partial<MenuItem>>({});

  // Utility functions
  const filteredAndSortedItems = useCallback(() => {
    const filtered = items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort items
    filtered.sort((a, b) => {
      let aValue: string | number | Date, bValue: string | number | Date;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'stock':
          aValue = a.stock_quantity;
          bValue = b.stock_quantity;
          break;
        case 'category':
          aValue = a.categories?.name || '';
          bValue = b.categories?.name || '';
          break;
        case 'created':
        default:
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [items, searchQuery, selectedCategory, sortBy, sortOrder]);

  // Data fetching
  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, catsRes] = await Promise.all([
        fetch("/api/admin/menu/items"),
        fetch("/api/admin/categories")
      ]);

      const [itemsData, catsData] = await Promise.all([
        itemsRes.json(),
        catsRes.json()
      ]);

      console.log("Admin menu loaded items:", itemsData.items?.length || 0);
      if (itemsData.items?.length > 0) {
        console.log("First item:", itemsData.items[0]);
        console.log("First item images:", itemsData.items[0].images);
      }

      setItems(itemsData.items || []);
      setCategories(catsData.categories || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Form handling
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category_id: "",
      images: [],
      stock_quantity: "0",
      _files: [],
      is_available: true,
      ingredients: "",
      preparation_time: "",
      cooking_method: "",
      protein: "",
      carbs: "",
      fat: "",
      fiber: "",
      allergens: "",
      dietary_tags: "",
      calories: "",
    });
  };

  const resetEditForm = () => {
    setEditFormData({
      name: "",
      description: "",
      price: "",
      category_id: "",
      images: [],
      stock_quantity: "0",
      _files: [],
      is_available: true,
      ingredients: "",
      preparation_time: "",
      cooking_method: "",
      protein: "",
      carbs: "",
      fat: "",
      fiber: "",
      allergens: "",
      dietary_tags: "",
      calories: "",
    });
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const formDataObj = new FormData();
      formDataObj.append("file", file);

      const uploadRes = await fetch("/api/admin/upload", {
        method: "POST",
        body: formDataObj,
      });

      if (!uploadRes.ok) {
        throw new Error(`Failed to upload ${file.name}`);
      }

      const uploadData = await uploadRes.json();
      return uploadData.url;
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Start with existing uploaded images (not data URLs)
      let images = formData.images.filter(img => !img.startsWith('data:'));

      if (formData._files && formData._files.length > 0) {
        const uploadedUrls = await uploadImages(formData._files);
        images = [...images, ...uploadedUrls];
      }

      if (images.length === 0) {
        throw new Error("At least one image is required");
      }

      const res = await fetch("/api/admin/menu/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category_id: formData.category_id,
          images,
          stock_quantity: parseInt(formData.stock_quantity),
          is_available: formData.is_available,
          ingredients: formData.ingredients ? formData.ingredients.split(",").map(i => i.trim()).filter(i => i) : [],
          preparation_time: formData.preparation_time ? parseInt(formData.preparation_time) : null,
          cooking_method: formData.cooking_method || null,
          nutritional_info: {
            protein: formData.protein ? parseFloat(formData.protein) : null,
            carbs: formData.carbs ? parseFloat(formData.carbs) : null,
            fat: formData.fat ? parseFloat(formData.fat) : null,
            fiber: formData.fiber ? parseFloat(formData.fiber) : null,
          },
          allergens: formData.allergens ? formData.allergens.split(",").map(a => a.trim()).filter(a => a) : [],
          dietary_tags: formData.dietary_tags ? formData.dietary_tags.split(",").map(t => t.trim()).filter(t => t) : [],
          calories: formData.calories ? parseInt(formData.calories) : null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create menu item");
      }

      const data = await res.json();
      setItems(prev => [data.item, ...prev]);
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error creating menu item:", error);
      alert(error instanceof Error ? error.message : "Failed to create menu item. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Item operations
  const handleViewItem = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/menu/items/${id}`);
      if (res.ok) {
        const data = await res.json();
        const item = data.item;
        alert(`Item Details:\n\nName: ${item.name}\nDescription: ${item.description}\nPrice: $${item.price}\nStock: ${item.stock_quantity}\nCategory: ${item.categories?.name || 'Uncategorized'}\nStatus: ${item.is_available ? 'Available' : 'Unavailable'}`);
      } else {
        throw new Error("Failed to fetch item");
      }
    } catch (error) {
      console.error("Error fetching item:", error);
      alert("Error fetching item details");
    }
  };

  const handleEditItem = async (id: string) => {
    try {
      setEditItemId(id);
      const res = await fetch(`/api/admin/menu/items/${id}`);
      if (res.ok) {
        const data = await res.json();
        const item = data.item;
        setEditFormData({
          name: item.name,
          description: item.description || "",
          price: item.price.toString(),
          category_id: item.category_id || "",
          images: Array.isArray(item.images) ? item.images : (item.image_url ? [item.image_url] : []),
          stock_quantity: item.stock_quantity.toString(),
          _files: [],
          is_available: item.is_available,
          ingredients: item.ingredients ? item.ingredients.join(", ") : "",
          preparation_time: item.preparation_time ? item.preparation_time.toString() : "",
          cooking_method: item.cooking_method || "",
          protein: item.nutritional_info?.protein ? item.nutritional_info.protein.toString() : "",
          carbs: item.nutritional_info?.carbs ? item.nutritional_info.carbs.toString() : "",
          fat: item.nutritional_info?.fat ? item.nutritional_info.fat.toString() : "",
          fiber: item.nutritional_info?.fiber ? item.nutritional_info.fiber.toString() : "",
          allergens: item.allergens ? item.allergens.join(", ") : "",
          dietary_tags: item.dietary_tags ? item.dietary_tags.join(", ") : "",
          calories: item.calories ? item.calories.toString() : "",
        });
        setEditModal(true);
      } else {
        throw new Error("Failed to fetch item");
      }
    } catch (error) {
      console.error("Error fetching item for edit:", error);
      alert("Error loading item for edit");
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItemId) return;

    setSubmitting(true);
    try {
      // Start with existing uploaded images (not data URLs)
      let images = editFormData.images.filter(img => !img.startsWith('data:'));

      if (editFormData._files && editFormData._files.length > 0) {
        const uploadedUrls = await uploadImages(editFormData._files);
        images = [...images, ...uploadedUrls];
      }

      if (images.length === 0) {
        throw new Error("At least one image is required");
      }

      const res = await fetch(`/api/admin/menu/items/${editItemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editFormData.name,
          description: editFormData.description,
          price: parseFloat(editFormData.price),
          category_id: editFormData.category_id,
          images,
          stock_quantity: parseInt(editFormData.stock_quantity),
          is_available: editFormData.is_available,
          ingredients: editFormData.ingredients ? editFormData.ingredients.split(",").map(i => i.trim()).filter(i => i) : [],
          preparation_time: editFormData.preparation_time ? parseInt(editFormData.preparation_time) : null,
          cooking_method: editFormData.cooking_method || null,
          nutritional_info: {
            protein: editFormData.protein ? parseFloat(editFormData.protein) : null,
            carbs: editFormData.carbs ? parseFloat(editFormData.carbs) : null,
            fat: editFormData.fat ? parseFloat(editFormData.fat) : null,
            fiber: editFormData.fiber ? parseFloat(editFormData.fiber) : null,
          },
          allergens: editFormData.allergens ? editFormData.allergens.split(",").map(a => a.trim()).filter(a => a) : [],
          dietary_tags: editFormData.dietary_tags ? editFormData.dietary_tags.split(",").map(t => t.trim()).filter(t => t) : [],
          calories: editFormData.calories ? parseInt(editFormData.calories) : null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update menu item");
      }

      const data = await res.json();
      setItems(prev => prev.map(item =>
        item.id === editItemId ? data.item : item
      ));
      setEditModal(false);
      resetEditForm();
    } catch (error) {
      console.error("Error updating menu item:", error);
      alert(error instanceof Error ? error.message : "Error updating menu item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/menu/items/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete item");
      }

      setItems(prev => prev.filter(item => item.id !== id));
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      console.error("Error deleting menu item:", error);
      alert("Error deleting menu item");
    } finally {
      setDeleting(null);
    }
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedItems.size} items?`)) return;

    setDeleting('bulk');
    try {
      const deletePromises = Array.from(selectedItems).map(id =>
        fetch(`/api/admin/menu/items/${id}`, { method: "DELETE" })
      );

      const results = await Promise.all(deletePromises);
      const failed = results.filter(res => !res.ok).length;

      if (failed > 0) {
        alert(`${failed} items failed to delete`);
      }

      setItems(prev => prev.filter(item => !selectedItems.has(item.id)));
      setSelectedItems(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error("Error bulk deleting items:", error);
      alert("Error deleting items");
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkCategoryChange = async (categoryId: string) => {
    if (selectedItems.size === 0) return;

    setSubmitting(true);
    try {
      const updatePromises = Array.from(selectedItems).map(id =>
        fetch(`/api/admin/menu/items/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category_id: categoryId }),
        })
      );

      await Promise.all(updatePromises);
      await fetchData(); // Refresh data
      setSelectedItems(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error("Error updating categories:", error);
      alert("Error updating categories");
    } finally {
      setSubmitting(false);
    }
  };

  // Inline editing
  const startInlineEdit = (item: MenuItem) => {
    setInlineEditing(item.id);
    setInlineFormData({
      name: item.name,
      price: item.price,
      stock_quantity: item.stock_quantity,
    });
  };

  const saveInlineEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/menu/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inlineFormData),
      });

      if (!res.ok) {
        throw new Error("Failed to update item");
      }

      const data = await res.json();
      setItems(prev => prev.map(item =>
        item.id === id ? data.item : item
      ));
      setInlineEditing(null);
      setInlineFormData({});
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Error updating item");
    }
  };

  // Selection handlers
  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllItems = () => {
    const allIds = new Set(filteredAndSortedItems().map(item => item.id));
    setSelectedItems(allIds);
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const filteredItems = filteredAndSortedItems();

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Management</h1>
              <p className="text-gray-600">Manage your restaurant&apos;s menu items, pricing, and inventory</p>
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {items.length} total items
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {items.filter(item => item.stock_quantity < 10).length} low stock
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
              >
                {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid3X3 className="w-5 h-5" />}
              </button>
              <button
                onClick={() => {
                  const csvContent = [
                    ['Name', 'Description', 'Price', 'Category', 'Stock', 'Available', 'Images'].join(','),
                    ...items.map(item => [
                      `"${item.name}"`,
                      `"${item.description || ''}"`,
                      item.price,
                      `"${item.categories?.name || ''}"`,
                      item.stock_quantity,
                      item.is_available ? 'Yes' : 'No',
                      `"${Array.isArray(item.images) ? item.images.join('; ') : item.images || ''}"`
                    ].join(','))
                  ].join('\n');

                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `all-menu-items-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all"
                title="Export all items to CSV"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
              >
                <Plus className="w-5 h-5" />
                Add Item
              </button>
              <Link
                href="/admin/menu/qr"
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 font-medium rounded-xl hover:bg-purple-200 transition-all"
              >
                <QrCode className="w-4 h-4" />
                Menu QR
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{items.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">
                  {items.filter(item => item.is_available).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {items.filter(item => item.stock_quantity < 10).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${items.length > 0 ? (items.reduce((sum, item) => sum + item.price, 0) / items.length).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none min-w-[200px]"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                >
                  <option value="created">Sort by: Newest</option>
                  <option value="name">Sort by: Name</option>
                  <option value="price">Sort by: Price</option>
                  <option value="stock">Sort by: Stock</option>
                  <option value="category">Sort by: Category</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <ChevronDown className={cn("w-4 h-4 transition-transform", sortOrder === 'asc' && "rotate-180")} />
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedItems.size > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{selectedItems.size} selected</span>
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Bulk Actions
                </button>
                <button
                  onClick={clearSelection}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Bulk Actions Panel */}
          {showBulkActions && selectedItems.size > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Actions:</span>
                <select
                  onChange={(e) => handleBulkCategoryChange(e.target.value)}
                  className="px-3 py-1 text-sm rounded-lg border border-gray-200 focus:border-red-500 outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>Change Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      Move to {category.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const selectedData = filteredItems.filter(item => selectedItems.has(item.id));
                    const csvContent = [
                      ['Name', 'Description', 'Price', 'Category', 'Stock', 'Available', 'Images'].join(','),
                      ...selectedData.map(item => [
                        `"${item.name}"`,
                        `"${item.description || ''}"`,
                        item.price,
                        `"${item.categories?.name || ''}"`,
                        item.stock_quantity,
                        item.is_available ? 'Yes' : 'No',
                        `"${Array.isArray(item.images) ? item.images.join('; ') : item.images || ''}"`
                      ].join(','))
                    ].join('\n');

                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `menu-items-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Export CSV
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={deleting === 'bulk'}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting === 'bulk' ? 'Deleting...' : 'Delete Selected'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Items Grid/List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="animate-pulse space-y-4">
                  <div className="aspect-square bg-gray-200 rounded-xl"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedCategory !== 'all'
                ? "Try adjusting your search or filters"
                : "Get started by adding your first menu item"
              }
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-all"
            >
              Add Your First Item
            </button>
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          )}>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all group",
                  viewMode === 'grid' ? "shadow-sm" : "shadow-sm",
                  selectedItems.has(item.id) && "ring-2 ring-red-500"
                )}
              >
                {/* Selection Checkbox */}
                <div className="p-4 pb-0">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => toggleItemSelection(item.id)}
                    >
                      {selectedItems.has(item.id) ? (
                        <CheckSquare className="w-5 h-5 text-red-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400 hover:text-red-600" />
                      )}
                    </div>

                    {/* Actions Menu */}
                    <div className="relative">
                      <button
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                        onClick={() => {/* Toggle dropdown */}}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Image */}
                <div className="aspect-square relative overflow-hidden">
                  {item.images && item.images.length > 0 ? (
                    <div className="relative w-full h-full">
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {item.images.length > 1 && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                          <Upload className="w-3 h-3 text-white" />
                          <span className="text-xs text-white font-medium">{item.images.length}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <div className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                      item.is_available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {item.is_available ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {item.is_available ? "Available" : "Unavailable"}
                    </div>
                  </div>

                  {/* Low Stock Warning */}
                  {item.stock_quantity < 10 && (
                    <div className="absolute top-3 left-3">
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Low Stock
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  {inlineEditing === item.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={inlineFormData.name || ''}
                        onChange={(e) => setInlineFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-red-500 outline-none"
                        placeholder="Item name"
                      />
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          value={inlineFormData.price || ''}
                          onChange={(e) => setInlineFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-red-500 outline-none"
                          placeholder="Price"
                        />
                      </div>
                      <input
                        type="number"
                        value={inlineFormData.stock_quantity || ''}
                        onChange={(e) => setInlineFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-red-500 outline-none"
                        placeholder="Stock quantity"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveInlineEdit(item.id)}
                          className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setInlineEditing(null)}
                          className="px-3 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-1">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-red-600" />
                          <span className="text-xl font-bold text-red-600">
                            {item.price.toFixed(2)}
                          </span>
                        </div>
                        <span className={cn(
                          "text-sm font-medium",
                          item.stock_quantity < 10 ? "text-orange-600" : "text-gray-600"
                        )}>
                          {item.stock_quantity} in stock
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {item.categories?.name || "Uncategorized"}
                        </span>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleViewItem(item.id)}
                            className="p-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => startInlineEdit(item)}
                            className="p-2 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors"
                            title="Quick edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditItem(item.id)}
                            className="p-2 rounded-lg hover:bg-purple-50 hover:text-purple-600 transition-colors"
                            title="Full edit"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            disabled={deleting === item.id}
                            className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Item Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Add New Menu Item</h2>
                    <p className="text-gray-600 text-sm">Fill in the details to add a new item to your menu</p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-8 max-h-[calc(90vh-200px)] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Item Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Margherita Pizza"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Describe the item, ingredients, allergens..."
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Category *
                        </label>
                        <select
                          required
                          value={formData.category_id}
                          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                        >
                          <option value="">Select a category</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Price *
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            placeholder="0.00"
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Stock Quantity
                        </label>
                        <div className="relative">
                          <Package className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="number"
                            min="0"
                            value={formData.stock_quantity}
                            onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                            placeholder="Enter stock quantity"
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Availability
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="availability"
                              checked={formData.is_available}
                              onChange={() => setFormData({ ...formData, is_available: true })}
                              className="w-4 h-4 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">Available</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="availability"
                              checked={!formData.is_available}
                              onChange={() => setFormData({ ...formData, is_available: false })}
                              className="w-4 h-4 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">Unavailable</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    </div>

                  {/* Detailed Information Section */}
                  <div className="border-t border-gray-100 pt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Detailed Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left Column - Cooking Info */}
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Preparation Time (minutes)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.preparation_time}
                            onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                            placeholder="e.g., 15"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Cooking Method
                          </label>
                          <select
                            value={formData.cooking_method}
                            onChange={(e) => setFormData({ ...formData, cooking_method: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                          >
                            <option value="">Select cooking method</option>
                            <option value="Wood-fired">Wood-fired</option>
                            <option value="Grilled">Grilled</option>
                            <option value="Baked">Baked</option>
                            <option value="Pan-seared">Pan-seared</option>
                            <option value="Deep-fried">Deep-fried</option>
                            <option value="Steamed">Steamed</option>
                            <option value="Raw">Raw</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Ingredients (comma-separated)
                          </label>
                          <textarea
                            value={formData.ingredients}
                            onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                            placeholder="e.g., Fresh tomatoes, Mozzarella cheese, Basil leaves, Olive oil"
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Calories
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.calories}
                            onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                            placeholder="e.g., 450"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                          />
                        </div>
                      </div>

                      {/* Right Column - Nutrition & Tags */}
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Nutritional Information (per serving)
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Protein (g)</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={formData.protein}
                                onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                                placeholder="29"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Carbs (g)</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={formData.carbs}
                                onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                                placeholder="30"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Fat (g)</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={formData.fat}
                                onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                                placeholder="9"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Fiber (g)</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={formData.fiber}
                                onChange={(e) => setFormData({ ...formData, fiber: e.target.value })}
                                placeholder="6"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Allergens (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={formData.allergens}
                            onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                            placeholder="e.g., Dairy, Gluten, Nuts"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Dietary Tags (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={formData.dietary_tags}
                            onChange={(e) => setFormData({ ...formData, dietary_tags: e.target.value })}
                            placeholder="e.g., Vegetarian, Gluten-Free, Spicy"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Image Upload Section */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Item Images *
                    </label>
                    <MultiImageUpload
                      value={formData.images}
                      onChange={(files, previewUrls) => setFormData(prev => ({
                        ...prev,
                        _files: [...(prev._files || []), ...files],
                        images: [...prev.images, ...previewUrls]
                      }))}
                      onRemove={(index) => setFormData(prev => ({
                        ...prev,
                        images: prev.images.filter((_, i) => i !== index),
                        _files: (prev._files || []).filter((_, i) => i !== index)
                      }))}
                      maxImages={5}
                      required
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="flex-1 px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-red-700"
                    >
                      {submitting ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                          <span>Creating Item...</span>
                        </div>
                      ) : (
                        "Add Menu Item"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Item Modal */}
        {editModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Edit Menu Item</h2>
                    <p className="text-gray-600 text-sm">Update the item details</p>
                  </div>
                  <button
                    onClick={() => setEditModal(false)}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-8 max-h-[calc(90vh-200px)] overflow-y-auto">
                <form onSubmit={handleUpdateItem} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Item Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={editFormData.name}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Description
                        </label>
                        <textarea
                          value={editFormData.description}
                          onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Category *
                        </label>
                        <select
                          required
                          value={editFormData.category_id}
                          onChange={(e) => setEditFormData({ ...editFormData, category_id: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                        >
                          <option value="">Select a category</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Price *
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={editFormData.price}
                            onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Stock Quantity
                        </label>
                        <div className="relative">
                          <Package className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="number"
                            min="0"
                            value={editFormData.stock_quantity}
                            onChange={(e) => setEditFormData({ ...editFormData, stock_quantity: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Availability
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="edit-availability"
                              checked={editFormData.is_available}
                              onChange={() => setEditFormData({ ...editFormData, is_available: true })}
                              className="w-4 h-4 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">Available</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="edit-availability"
                              checked={!editFormData.is_available}
                              onChange={() => setEditFormData({ ...editFormData, is_available: false })}
                              className="w-4 h-4 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">Unavailable</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Information Section */}
                  <div className="border-t border-gray-100 pt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Detailed Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left Column - Cooking Info */}
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Preparation Time (minutes)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={editFormData.preparation_time}
                            onChange={(e) => setEditFormData({ ...editFormData, preparation_time: e.target.value })}
                            placeholder="e.g., 15"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Cooking Method
                          </label>
                          <select
                            value={editFormData.cooking_method}
                            onChange={(e) => setEditFormData({ ...editFormData, cooking_method: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                          >
                            <option value="">Select cooking method</option>
                            <option value="Wood-fired">Wood-fired</option>
                            <option value="Grilled">Grilled</option>
                            <option value="Baked">Baked</option>
                            <option value="Pan-seared">Pan-seared</option>
                            <option value="Deep-fried">Deep-fried</option>
                            <option value="Steamed">Steamed</option>
                            <option value="Raw">Raw</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Ingredients (comma-separated)
                          </label>
                          <textarea
                            value={editFormData.ingredients}
                            onChange={(e) => setEditFormData({ ...editFormData, ingredients: e.target.value })}
                            placeholder="e.g., Fresh tomatoes, Mozzarella cheese, Basil leaves, Olive oil"
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Calories
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={editFormData.calories}
                            onChange={(e) => setEditFormData({ ...editFormData, calories: e.target.value })}
                            placeholder="e.g., 450"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                          />
                        </div>
                      </div>

                      {/* Right Column - Nutrition & Tags */}
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Nutritional Information (per serving)
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Protein (g)</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={editFormData.protein}
                                onChange={(e) => setEditFormData({ ...editFormData, protein: e.target.value })}
                                placeholder="29"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Carbs (g)</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={editFormData.carbs}
                                onChange={(e) => setEditFormData({ ...editFormData, carbs: e.target.value })}
                                placeholder="30"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Fat (g)</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={editFormData.fat}
                                onChange={(e) => setEditFormData({ ...editFormData, fat: e.target.value })}
                                placeholder="9"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Fiber (g)</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={editFormData.fiber}
                                onChange={(e) => setEditFormData({ ...editFormData, fiber: e.target.value })}
                                placeholder="6"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Allergens (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={editFormData.allergens}
                            onChange={(e) => setEditFormData({ ...editFormData, allergens: e.target.value })}
                            placeholder="e.g., Dairy, Gluten, Nuts"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Dietary Tags (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={editFormData.dietary_tags}
                            onChange={(e) => setEditFormData({ ...editFormData, dietary_tags: e.target.value })}
                            placeholder="e.g., Vegetarian, Gluten-Free, Spicy"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Image Upload Section */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Item Images
                    </label>
                    <MultiImageUpload
                      value={editFormData.images}
                      onChange={(files, previewUrls) => setEditFormData(prev => ({
                        ...prev,
                        _files: [...(prev._files || []), ...files],
                        images: [...prev.images, ...previewUrls]
                      }))}
                      onRemove={(index) => setEditFormData(prev => ({
                        ...prev,
                        images: prev.images.filter((_, i) => i !== index),
                        _files: (prev._files || []).filter((_, i) => i !== index)
                      }))}
                      maxImages={5}
                      required
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setEditModal(false);
                        resetEditForm();
                      }}
                      className="flex-1 px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-red-700"
                    >
                      {submitting ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                          <span>Updating Item...</span>
                        </div>
                      ) : (
                        "Update Menu Item"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}