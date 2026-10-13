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

  const quickAdjustStock = async (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newStock = Math.max(0, item.stock_quantity + delta);
    setItems(prev => prev.map(i => i.id === id ? { ...i, stock_quantity: newStock } : i));
    try {
      await fetch(`/api/admin/menu/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_quantity: newStock }),
      });
    } catch (err) {
      console.error("Failed to adjust stock:", err);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Inventory & Stock Watch</h1>
          <p className="text-sm text-slate-600 mt-1">Live ingredient tracking, low inventory alerts, and instant replenishment.</p>
        </div>
        <button 
          onClick={fetchItems} 
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm shadow-sm active:scale-95 shrink-0 self-start sm:self-auto min-h-[42px]"
        >
          <RefreshCw className={cn("w-4 h-4 text-slate-600", loading && "animate-spin")} /> 
          Refresh Stock
        </button>
      </div>

      {/* Alerts: Full-Bleed Vibrant Gradients */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4.5">
        {/* Critical Card */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-rose-600 via-red-600 to-rose-800 text-white shadow-lg shadow-rose-950/20 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-rose-100 hidden xs:inline">
              Urgent
            </span>
          </div>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-100/80 mb-0.5">Critical (&lt;5)</p>
          <p className="text-xl sm:text-3xl font-black text-white tracking-tight">{criticalCount}</p>
        </div>

        {/* Low Stock Card */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 text-white shadow-lg shadow-amber-950/20 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-amber-100 hidden xs:inline">
              Warning
            </span>
          </div>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-100/80 mb-0.5">Low Stock</p>
          <p className="text-xl sm:text-3xl font-black text-white tracking-tight">{lowCount}</p>
        </div>

        {/* Out of Stock Card */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-800 via-gray-900 to-black text-white shadow-lg shadow-slate-950/20 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-slate-300 hidden xs:inline">
              Depleted
            </span>
          </div>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-300 mb-0.5">Out of Stock</p>
          <p className="text-xl sm:text-3xl font-black text-white tracking-tight">{outOfStockCount}</p>
        </div>
      </div>

      {/* Controls & Filter Pills */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search items by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-red-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto max-w-full pb-1 shrink-0 scrollbar-none">
            {(['all', 'low', 'critical', 'out'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 min-h-[38px]",
                  filter === f 
                    ? "bg-slate-900 text-white shadow-sm" 
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                {f === 'all' ? 'All Items' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedItems.size > 0 && (
          <div className="p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center gap-3">
            <span className="font-bold text-xs sm:text-sm text-slate-800">{selectedItems.size} items selected:</span>
            
            <select 
              value={bulkAction} 
              onChange={e => setBulkAction(e.target.value as any)} 
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-800 outline-none"
            >
              <option value="add">Add (+)</option>
              <option value="subtract">Subtract (-)</option>
              <option value="set">Set to (=)</option>
            </select>
            
            <input 
              type="number" 
              value={bulkValue} 
              onChange={e => setBulkValue(parseInt(e.target.value) || 0)} 
              className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-800 outline-none" 
              placeholder="Qty"
            />
            
            <button 
              onClick={applyBulkStockUpdate} 
              disabled={isUpdating || bulkValue === 0}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-red-600/20 disabled:opacity-50 transition-all active:scale-95"
            >
              {isUpdating ? 'Updating...' : 'Apply Stock'}
            </button>

            <button 
              onClick={() => setSelectedItems(new Set())} 
              className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* MOBILE STRICT 2x2 GRID (No more horizontal table scroll on phones) */}
      <div className="md:hidden grid grid-cols-2 gap-2.5">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="p-4 bg-white rounded-2xl border border-slate-200 animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-2/3" />
              <div className="h-8 bg-slate-200 rounded-xl" />
              <div className="h-6 bg-slate-200 rounded-xl" />
            </div>
          ))
        ) : filteredItems.length === 0 ? (
          <div className="col-span-2 p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
            No inventory items matching this filter
          </div>
        ) : (
          filteredItems.map(item => {
            const status = getStockStatus(item.stock_quantity, item.low_stock_threshold || 10);
            const isSelected = selectedItems.has(item.id);
            const isAlert = item.stock_quantity < 5;

            return (
              <div 
                key={item.id}
                className={cn(
                  "p-3 rounded-2xl border transition-all flex flex-col justify-between shadow-sm relative overflow-hidden",
                  isAlert 
                    ? "bg-gradient-to-br from-rose-600 via-red-600 to-rose-700 text-white border-rose-500/40" 
                    : item.stock_quantity < (item.low_stock_threshold || 10)
                      ? "bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 text-white border-amber-400/40"
                      : "bg-white text-slate-900 border-slate-200/90",
                  isSelected && "ring-2 ring-red-500"
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => toggleSelect(item.id)}
                      className="w-4 h-4 rounded mt-0.5"
                    />
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0",
                      isAlert || item.stock_quantity < (item.low_stock_threshold || 10)
                        ? "bg-black/25 text-white backdrop-blur-md border border-white/20"
                        : "bg-slate-100 text-slate-700"
                    )}>
                      {status.label}
                    </span>
                  </div>

                  <h4 className={cn(
                    "font-black text-xs sm:text-sm leading-tight line-clamp-2 mb-1",
                    isAlert || item.stock_quantity < (item.low_stock_threshold || 10) ? "text-white" : "text-slate-900"
                  )}>
                    {item.name}
                  </h4>
                  <p className={cn(
                    "text-[10px] font-medium truncate mb-2",
                    isAlert || item.stock_quantity < (item.low_stock_threshold || 10) ? "text-white/80" : "text-slate-500"
                  )}>
                    {item.categories?.name || 'General'}
                  </p>
                </div>

                <div>
                  <div className={cn(
                    "p-2 rounded-xl text-center mb-2",
                    isAlert || item.stock_quantity < (item.low_stock_threshold || 10)
                      ? "bg-black/20 backdrop-blur-md border border-white/20 text-white"
                      : "bg-slate-100 text-slate-900"
                  )}>
                    <div className="text-[10px] uppercase font-bold opacity-80">Current Stock</div>
                    <div className="text-xl font-black">{item.stock_quantity}</div>
                  </div>

                  {/* Quick Stepper Buttons (44px min tap targets) */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => quickAdjustStock(item.id, -1)}
                      className={cn(
                        "flex-1 min-h-[38px] rounded-xl font-black text-base flex items-center justify-center transition-all active:scale-95",
                        isAlert || item.stock_quantity < (item.low_stock_threshold || 10)
                          ? "bg-white/20 hover:bg-white/30 text-white border border-white/30"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                      )}
                      title="Minus 1"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => quickAdjustStock(item.id, 5)}
                      className={cn(
                        "flex-1 min-h-[38px] rounded-xl font-black text-xs flex items-center justify-center transition-all active:scale-95",
                        isAlert || item.stock_quantity < (item.low_stock_threshold || 10)
                          ? "bg-white text-slate-900 font-black shadow-sm"
                          : "bg-slate-900 text-white font-black shadow-sm"
                      )}
                      title="Add 5"
                    >
                      +5
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
        <table className="w-full min-w-[680px]">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
            <tr>
              <th className="p-4 text-left w-8">
                <input 
                  type="checkbox" 
                  checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                  onChange={selectAllFiltered}
                />
              </th>
              <th className="p-4 text-left">Item Name</th>
              <th className="p-4 text-left">Category</th>
              <th className="p-4 text-left">Stock Level</th>
              <th className="p-4 text-left">Threshold</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-right">Adjust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">Loading stock inventory...</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">No items found</td></tr>
            ) : (
              filteredItems.map(item => {
                const status = getStockStatus(item.stock_quantity, item.low_stock_threshold || 10);
                const isSelected = selectedItems.has(item.id);
                return (
                  <tr key={item.id} className={cn("hover:bg-slate-50/70 transition-colors", isSelected && "bg-red-50/60")}>
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelect(item.id)}
                      />
                    </td>
                    <td className="p-4 font-bold text-sm text-slate-900">{item.name}</td>
                    <td className="p-4 text-sm font-medium text-slate-600">{item.categories?.name || '—'}</td>
                    <td className="p-4">
                      {editingId === item.id ? (
                        <div className="flex gap-2 items-center">
                          <input 
                            type="number" 
                            value={editValue} 
                            onChange={e => setEditValue(parseInt(e.target.value) || 0)}
                            className="w-20 border border-slate-300 rounded-xl px-2 py-1 text-sm font-bold outline-none"
                          />
                          <button onClick={() => saveInlineStock(item.id)} className="text-emerald-600 p-1 hover:bg-emerald-50 rounded-lg"><Save size={16} /></button>
                          <button onClick={() => setEditingId(null)} className="text-slate-400 p-1 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
                        </div>
                      ) : (
                        <span className="font-black text-lg text-slate-900">{item.stock_quantity}</span>
                      )}
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600">{item.low_stock_threshold || 10}</td>
                    <td className="p-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-black", status.color)}>
                        {status.label}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => quickAdjustStock(item.id, -1)}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                          title="Subtract 1"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => quickAdjustStock(item.id, 5)}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                          title="Add 5"
                        >
                          +5
                        </button>
                        <button 
                          onClick={() => { setEditingId(item.id); setEditValue(item.stock_quantity); }}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                          title="Custom Edit"
                        >
                          <Edit2 size={15} />
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
    </div>
  );
}

function getStockStatus(stock: number, threshold: number) {
  if (stock === 0) return { label: 'Out of Stock', color: 'bg-rose-100 text-rose-700' };
  if (stock < 5) return { label: 'Critical', color: 'bg-rose-100 text-rose-700' };
  if (stock < threshold) return { label: 'Low Stock', color: 'bg-amber-100 text-amber-700' };
  return { label: 'Good Stock', color: 'bg-emerald-100 text-emerald-700' };
}
