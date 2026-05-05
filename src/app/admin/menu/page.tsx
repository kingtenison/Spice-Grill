"use client";

import { useEffect, useState } from "react";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye,
  CheckCircle2,
  XCircle,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  stock_quantity: number;
  categories?: { name: string };
}

interface Category {
  id: string;
  name: string;
}

interface NewItemForm {
  name: string;
  description: string;
  price: string;
  category_id: string;
  image_url: string;
  stock_quantity: string;
  _file?: File; // Temporary property for file upload
}

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState<NewItemForm>({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image_url: "",
    stock_quantity: "0",
    _file: undefined,
  });
  const [editFormData, setEditFormData] = useState<NewItemForm>({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image_url: "",
    stock_quantity: "0",
    _file: undefined,
  });

  useEffect(() => {
    (async () => {
      try {
        // Fetch menu items
        const itemsRes = await fetch("/api/admin/menu/items");
        const itemsData = await itemsRes.json();
        setItems(itemsData.items || []);

        // Fetch categories
        const catsRes = await fetch("/api/admin/categories");
        const catsData = await catsRes.json();
        setCategories(catsData.categories || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let imageUrl = formData.image_url;
      
      // If we have a file to upload, upload it first
      if (formData._file) {
        const formDataObj = new FormData();
        formDataObj.append("file", formData._file);
        
        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: formDataObj,
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;
        } else {
          throw new Error("Failed to upload image");
        }
      }
      
      const res = await fetch("/api/admin/menu/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category_id: formData.category_id,
          image_url: imageUrl,
          stock_quantity: parseInt(formData.stock_quantity),
          is_available: true, // Default to available
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems([data.item, ...items]);
        setShowModal(false);
        // Reset form completely
        setFormData({ name: "", description: "", price: "", category_id: "", image_url: "", stock_quantity: "0", _file: undefined });
      }
    } catch (error) {
      console.error("Error creating menu item:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewItem = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/menu/items/${id}`);
      if (res.ok) {
        const data = await res.json();
        // For now, just log the item data - in a real app, you might show a modal
        console.log("Viewing item:", data.item);
        alert(`Viewing item: ${data.item.name}\nDescription: ${data.item.description}\nPrice: $${data.item.price}\nStock: ${data.item.stock_quantity}`);
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
          description: item.description,
          price: item.price.toString(),
          category_id: item.category_id,
          image_url: item.image_url || "",
          stock_quantity: item.stock_quantity.toString(),
          _file: undefined,
        });
        setEditModal(true);
      }
    } catch (error) {
      console.error("Error fetching item for edit:", error);
      alert("Error loading item for edit");
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!editItemId) return;

      let imageUrl = editFormData.image_url;
      
      // If we have a file to upload, upload it first
      if (editFormData._file) {
        const formDataObj = new FormData();
        formDataObj.append("file", editFormData._file);
        
        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: formDataObj,
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;
        } else {
          throw new Error("Failed to upload image");
        }
      }

      const res = await fetch(`/api/admin/menu/items/${editItemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editFormData.name,
          description: editFormData.description,
          price: parseFloat(editFormData.price),
          category_id: editFormData.category_id,
          image_url: imageUrl,
          stock_quantity: parseInt(editFormData.stock_quantity),
          is_available: true, // Keep existing availability
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update the item in our state
        setItems(prevItems => 
          prevItems.map(item => 
            item.id === editItemId ? data.item : item
          )
        );
        setEditModal(false);
        // Reset edit form
        setEditFormData({
          name: "",
          description: "",
          price: "",
          category_id: "",
          image_url: "",
          stock_quantity: "0",
          _file: undefined,
        });
      }
    } catch (error) {
      console.error("Error updating menu item:", error);
      alert("Error updating menu item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/menu/items/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Remove the item from our state
        setItems(prevItems => prevItems.filter(item => item.id !== id));
      } else {
        throw new Error("Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting menu item:", error);
      alert("Error deleting menu item");
    } finally {
      setDeleting(false);
    }
  };

  return (
<div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold mb-1 text-gray-900">Menu Management</h1>
          <p className="text-gray-600">Manage your dishes, prices, and availability.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-500 text-white font-bold shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all"
        >
          <Plus className="w-5 h-5" /> Add New Item
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="Search by name or category..."
            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:border-red-500 focus:bg-white transition-all outline-none text-sm"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select className="flex-grow md:w-48 px-4 py-2.5 rounded-xl bg-gray-100 border border-gray-200 font-bold text-sm outline-none focus:border-red-500 transition-all cursor-pointer text-gray-900">
            <option>All Categories</option>
            <option>Signature Pizzas</option>
            <option>Gourmet Burgers</option>
            <option>Fresh Salads</option>
            <option>Iced Drinks</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <th className="px-6 py-5">Product</th>
              <th className="px-6 py-5">Category</th>
              <th className="px-6 py-5">Price</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5">Stock</th>
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
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No menu items found
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                   <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Eye className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <span className="font-bold text-sm group-hover:text-red-500 transition-colors text-gray-900">{item.name}</span>
                      </div>
                    </td>
                   <td className="px-6 py-4">
                     <span className="text-xs font-bold text-gray-500">{item.categories?.name || "Uncategorized"}</span>
                   </td>
                   <td className="px-6 py-4 font-black text-sm text-red-500">
                     ${item.price.toFixed(2)}
                   </td>
                   <td className="px-6 py-4">
                     <div className={cn(
                       "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase",
                       item.is_available ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                     )}>
                       {item.is_available ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                       {item.is_available ? "Available" : "Out of Stock"}
                     </div>
                   </td>
                   <td className="px-6 py-4">
                     <span className={cn(
                       "text-sm font-bold",
                       item.stock_quantity < 10 ? "text-orange-500" : "text-gray-500"
                     )}>{item.stock_quantity} in stock</span>
                   </td>
                   <td className="px-6 py-4">
                     <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         className="p-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all" 
                         title="View"
                         onClick={() => handleViewItem(item.id)}
                         disabled={loading}
                       >
                         <Eye className="w-4 h-4" />
                       </button>
                       <button 
                         className="p-2 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-all" 
                         title="Edit"
                         onClick={() => handleEditItem(item.id)}
                         disabled={loading || submitting}
                       >
                         <Edit2 className="w-4 h-4" />
                       </button>
                       <button 
                         className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all" 
                         title="Delete"
                         onClick={() => handleDeleteItem(item.id)}
                         disabled={loading || deleting}
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

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 w-full max-w-[500px] max-h-[90vh] overflow-y-auto border border-border/50 shadow-2xl shadow-primary/10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-primary">Add New Menu Item</h2>
                <button onClick={() => setShowModal(false)} className="p-3 rounded-xl hover:bg-primary/10 transition-all duration-200">
                  <X className="w-6 h-6 text-primary" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Name</label>
                  <input
                    type="text" required value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-5 py-3 rounded-xl bg-accent/50 border border-transparent focus:border-primary focus:bg-accent/100 outline-none transition-all duration-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-5 py-3 rounded-xl bg-accent/50 border border-transparent focus:border-primary focus:bg-accent/100 outline-none transition-all duration-200 resize-none text-sm" rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Price (₦)</label>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-sm">₦</span>
                    <input
                      type="number" step="0.01" required value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="flex-1 px-5 py-3 rounded-xl bg-accent/50 border border-transparent focus:border-primary focus:bg-accent/100 outline-none transition-all duration-200 text-sm"
                    />
                  </div>
                </div>
                 <div className="space-y-2">
                   <label className="block text-sm font-medium text-muted-foreground mb-2">Category</label>
                   <select
                     value={formData.category_id}
                     onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                     className="w-full px-5 py-3 rounded-xl bg-accent/50 border border-transparent focus:border-primary focus:bg-accent/100 outline-none transition-all duration-200 text-sm"
                   >
                     <option value="">--Select Category--</option>
                     {categories.map(category => (
                       <option key={category.id} value={category.id}>
                         {category.name}
                       </option>
                     ))}
                   </select>
                 </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Image Upload</label>
                  <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/*"
                        required
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setFormData(prev => ({
                              ...prev,
                              image_url: event.target?.result as string || '',
                              _file: file
                            }));
                          };
                          reader.readAsDataURL(file);
                        } else {
                          // Clear the file and preview
                          setFormData(prev => ({
                            ...prev,
                            image_url: '',
                            _file: undefined
                          }));
                        }
                      }}
                      className="w-full px-5 py-3 rounded-xl bg-accent/50 border border-transparent focus:border-primary focus:bg-accent/100 outline-none transition-all duration-200 text-sm"
                    />
                    {formData.image_url && (
                      <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-accent/50">
                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.02]" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Stock Quantity</label>
                  <input
                    type="number" value={formData.stock_quantity}
                    onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                    className="w-full px-5 py-3 rounded-xl bg-accent/50 border border-transparent focus:border-primary focus:bg-accent/100 outline-none transition-all duration-200 text-sm"
                  />
                </div>
                <div className="flex gap-4 pt-6">
                  <button
                    type="button" onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 rounded-xl border border-transparent bg-muted/50 text-muted-foreground font-medium hover:bg-muted/100 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" disabled={submitting}
                    className="flex-1 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="animate-spin w-4 h-4 border-2 border-primary-foreground rounded-full"></span>
                        <span>Adding...</span>
                      </div>
                    ) : (
                      "Add Item"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
       
        {editModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 w-full max-w-[500px] max-h-[90vh] overflow-y-auto border border-border/50 shadow-2xl shadow-primary/10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-primary">Edit Menu Item</h2>
                <button onClick={() => setEditModal(false)} className="p-3 rounded-xl hover:bg-primary/10 transition-all duration-200">
                  <X className="w-6 h-6 text-primary" />
                </button>
              </div>
              <form onSubmit={handleUpdateItem} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Name</label>
                  <input
                    type="text" required value={editFormData.name}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    className="w-full px-5 py-3 rounded-xl bg-accent/50 border border-transparent focus:border-primary focus:bg-accent/100 outline-none transition-all duration-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    className="w-full px-5 py-3 rounded-xl bg-accent/50 border border-transparent focus:border-primary focus:bg-accent/100 outline-none transition-all duration-200 resize-none text-sm" rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Price (₦)</label>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-sm">₦</span>
                    <input
                      type="number" step="0.01" required value={editFormData.price}
                      onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                      className="flex-1 px-5 py-3 rounded-xl bg-accent/50 border border-transparent focus:border-primary focus:bg-accent/100 outline-none transition-all duration-200 text-sm"
                    />
                  </div>
                </div>
                 <div className="space-y-2">
                   <label className="block text-sm font-medium text-muted-foreground mb-2">Category</label>
                   <select
                     value={editFormData.category_id}
                     onChange={(e) => setEditFormData({...editFormData, category_id: e.target.value})}
                     className="w-full px-5 py-3 rounded-xl bg-accent/50 border border-transparent focus:border-primary focus:bg-accent/100 outline-none transition-all duration-200 text-sm"
                   >
                     <option value="">--Select Category--</option>
                     {categories.map(category => (
                       <option key={category.id} value={category.id}>
                         {category.name}
                       </option>
                     ))}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="block text-sm font-medium text-muted-foreground mb-2">Image Upload</label>
                   <div className="space-y-3">
                     <input
                       type="file"
                       accept="image/*"
                       onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setEditFormData(prev => ({
                              ...prev,
                              image_url: event.target?.result as string || '',
                              _file: file
                            }));
                          };
                          reader.readAsDataURL(file);
                        } else {
                          // Clear the file and preview
                          setEditFormData(prev => ({
                            ...prev,
                            image_url: '',
                            _file: undefined
                          }));
                        }
                      }}
                      className="w-full px-5 py-3 rounded-xl bg-accent/50 border border-transparent focus:border-primary focus:bg-accent/100 outline-none transition-all duration-200 text-sm"
                    />
                    {editFormData.image_url && (
                      <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-accent/50">
                        <img src={editFormData.image_url} alt="Preview" className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.02]" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Stock Quantity</label>
                  <input
                    type="number" value={editFormData.stock_quantity}
                    onChange={(e) => setEditFormData({...editFormData, stock_quantity: e.target.value})}
                    className="w-full px-5 py-3 rounded-xl bg-accent/50 border border-transparent focus:border-primary focus:bg-accent/100 outline-none transition-all duration-200 text-sm"
                  />
                </div>
                <div className="flex gap-4 pt-6">
                  <button
                    type="button" onClick={() => setEditModal(false)}
                    className="flex-1 px-6 py-3 rounded-xl border border-transparent bg-muted/50 text-muted-foreground font-medium hover:bg-muted/100 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" disabled={submitting}
                    className="flex-1 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="animate-spin w-4 h-4 border-2 border-primary-foreground rounded-full"></span>
                        <span>Updating...</span>
                      </div>
                    ) : (
                      "Update Item"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}