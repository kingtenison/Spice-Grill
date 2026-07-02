"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Package, Search, RefreshCw, Save, X, Edit2 } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_available: boolean;
  price: number;
  categories?: { name: string };
}

export default function AdminInventoryPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'critical' | 'out'>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'add' | 'subtract' | 'set'>('add');
  const [bulkValue, setBulkValue] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/menu/items");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    const threshold = item.low_stock_threshold || 10;
    const stock = item.stock_quantity;
    
    if (filter === 'low') matchesFilter = stock < threshold && stock > 0;
    if (filter === 'critical') matchesFilter = stock < 5;
    if (filter === 'out') matchesFilter = stock === 0;

    return matchesSearch && matchesFilter;
  });

  const criticalCount = items.filter(i => i.stock_quantity < 5).length;
  const lowCount = items.filter(i => {
    const t = i.low_stock_threshold || 10;
    return i.stock_quantity < t && i.stock_quantity > 0;
  }).length;
  const outOfStockCount = items.filter(i => i.stock_quantity === 0).length;

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedItems(newSet);
  };

  const selectAllFiltered = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(i => i.id)));
    }
  };

  const applyBulkStockUpdate = async () => {
    if (selectedItems.size === 0 || bulkValue === 0) return;

    setIsUpdating(true);
    const updates = Array.from(selectedItems).map(async (id) => {
      const item = items.find(i => i.id === id);
      if (!item) return;

      let newStock = item.stock_quantity;
      if (bulkAction === 'add') newStock += bulkValue;
      if (bulkAction === 'subtract') newStock = Math.max(0, newStock - bulkValue);
      if (bulkAction === 'set') newStock = Math.max(0, bulkValue);

      return fetch(`/api/admin/menu/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_quantity: newStock }),
      });
    });

    await Promise.all(updates);
    await fetchItems();
    setSelectedItems(new Set());
    setBulkValue(0);
    setIsUpdating(false);
  };

  const saveInlineStock = async (id: string) => {
    setIsUpdating(true);
    await fetch(`/api/admin/menu/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock_quantity: editValue }),
    });
    await fetchItems();
    setEditingId(null);
    setIsUpdating(false);
  };

  const getStockStatus = (stock: number, threshold: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700' };
    if (stock < 5) return { label: 'Critical', color: 'bg-red-100 text-red-700' };
    if (stock < threshold) return { label: 'Low Stock', color: 'bg-orange-100 text-orange-700' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Inventory Management</h1>
        <p className="text-gray-600">Track and manage stock levels across all menu items</p>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <div>
            <div className="font-bold text-red-700">{criticalCount} Critical</div>
            <div className="text-sm text-red-600">Items with &lt;5 units</div>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-orange-600" />
          <div>
            <div className="font-bold text-orange-700">{lowCount} Low Stock</div>
            <div className="text-sm text-orange-600">Below threshold</div>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3">
          <Package className="w-6 h-6 text-red-600" />
          <div>
            <div className="font-bold text-red-700">{outOfStockCount} Out of Stock</div>
            <div className="text-sm text-red-600">Zero inventory</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'low', 'critical', 'out'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                  filter === f ? "bg-red-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                )}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <button onClick={fetchItems} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl flex flex-wrap items-center gap-4">
            <span className="font-medium">{selectedItems.size} selected</span>
            
            <select value={bulkAction} onChange={e => setBulkAction(e.target.value as any)} className="border rounded px-3 py-1 text-sm">
              <option value="add">Add</option>
              <option value="subtract">Subtract</option>
              <option value="set">Set to</option>
            </select>
            
            <input 
              type="number" 
              value={bulkValue} 
              onChange={e => setBulkValue(parseInt(e.target.value) || 0)} 
              className="w-24 border rounded px-3 py-1 text-sm" 
              placeholder="Qty"
            />
            
            <button 
              onClick={applyBulkStockUpdate} 
              disabled={isUpdating || bulkValue === 0}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : 'Apply to Selected'}
            </button>

            <button onClick={() => setSelectedItems(new Set())} className="px-3 py-1 text-sm text-gray-600">Clear</button>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-left w-8">
                <input 
                  type="checkbox" 
                  checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                  onChange={selectAllFiltered}
                />
              </th>
              <th className="p-4 text-left font-bold">Item</th>
              <th className="p-4 text-left font-bold">Category</th>
              <th className="p-4 text-left font-bold">Current Stock</th>
              <th className="p-4 text-left font-bold">Threshold</th>
              <th className="p-4 text-left font-bold">Status</th>
              <th className="p-4 text-left font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center">Loading...</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">No items found</td></tr>
            ) : (
              filteredItems.map(item => {
                const status = getStockStatus(item.stock_quantity, item.low_stock_threshold || 10);
                const isSelected = selectedItems.has(item.id);
                return (
                  <tr key={item.id} className={cn("border-b hover:bg-gray-50", isSelected && "bg-red-50")}>
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelect(item.id)}
                      />
                    </td>
                    <td className="p-4 font-medium">{item.name}</td>
                    <td className="p-4 text-sm text-gray-600">{item.categories?.name || '—'}</td>
                    <td className="p-4">
                      {editingId === item.id ? (
                        <div className="flex gap-2">
                          <input 
                            type="number" 
                            value={editValue} 
                            onChange={e => setEditValue(parseInt(e.target.value) || 0)}
                            className="w-20 border rounded px-2 py-1 text-sm"
                          />
                          <button onClick={() => saveInlineStock(item.id)} className="text-green-600"><Save size={16} /></button>
                          <button onClick={() => setEditingId(null)} className="text-gray-500"><X size={16} /></button>
                        </div>
                      ) : (
                        <span className="font-bold text-lg">{item.stock_quantity}</span>
                      )}
                    </td>
                    <td className="p-4 text-sm">{item.low_stock_threshold || 10}</td>
                    <td className="p-4">
                      <span className={cn("px-3 py-1 rounded-full text-xs font-bold", status.color)}>
                        {status.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setEditingId(item.id); setEditValue(item.stock_quantity); }}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-500 text-center">
        Tip: Use bulk actions above to quickly restock multiple items. Low stock items are highlighted in the Menu section too.
      </div>
    </div>
  );
}

function getStockStatus(stock: number, threshold: number) {
  if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700' };
  if (stock < 5) return { label: 'Critical', color: 'bg-red-100 text-red-700' };
  if (stock < threshold) return { label: 'Low Stock', color: 'bg-orange-100 text-orange-700' };
  return { label: 'Good', color: 'bg-green-100 text-green-700' };
}
