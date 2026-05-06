"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Plus, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaxonomySelectorProps {
  label: string;
  description?: string;
  selected: string[];
  available: { id: string; name: string }[];
  onChange: (selected: string[]) => void;
  onCreate?: (name: string) => void;
  allowCreate?: boolean;
}

export function TaxonomySelector({
  label,
  description,
  selected,
  available,
  onChange,
  onCreate,
  allowCreate = false,
}: TaxonomySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newItem, setNewItem] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = available.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (itemId: string) => {
    if (selected.includes(itemId)) {
      onChange(selected.filter((id) => id !== itemId));
    } else {
      onChange([...selected, itemId]);
    }
    setSearch("");
  };

  const handleRemove = (itemId: string) => {
    onChange(selected.filter((id) => id !== itemId));
  };

  const handleCreate = () => {
    if (newItem.trim() && onCreate) {
      setCreating(true);
      onCreate(newItem.trim());
      setNewItem("");
      setCreating(false);
    }
  };

  const getSelectedItems = () => {
    return available.filter((item) => selected.includes(item.id));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-2" ref={containerRef}>
      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
        {label}
      </label>
      {description && <p className="text-xs text-gray-500 mb-2">{description}</p>}

      {/* Selected Tags Display */}
      <div className="flex flex-wrap gap-2 mb-2">
        {getSelectedItems().map((item) => (
          <span
            key={item.id}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-medium"
          >
            {item.name}
            <button
              type="button"
              onClick={() => handleRemove(item.id)}
              className="hover:text-red-900 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {selected.length === 0 && (
          <span className="text-xs text-gray-400 italic">None selected</span>
        )}
      </div>

      {/* Multi-select Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 hover:border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none flex items-center justify-between text-sm"
        >
          <span className="text-gray-500">
            {selected.length > 0 ? `${selected.length} selected` : "Select items..."}
          </span>
          <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-gray-100">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-red-500 outline-none text-sm"
                autoFocus
              />
            </div>

            {/* Options */}
            <div className="max-h-48 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="p-3 text-center text-sm text-gray-500">
                  {allowCreate && newItem.trim() ? (
                    <button
                      onClick={handleCreate}
                      className="flex items-center justify-center gap-2 w-full py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Plus className="w-4 h-4" />
                      Create "{newItem.trim()}"
                    </button>
                  ) : (
                    "No items found"
                  )}
                </div>
              ) : (
                filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      selected.includes(item.id)
                        ? "bg-red-50 text-red-700"
                        : "hover:bg-gray-50 text-gray-700"
                    )}
                  >
                    <Tag className="w-4 h-4" />
                    {item.name}
                    {selected.includes(item.id) && <span className="ml-auto">✓</span>}
                  </button>
                ))
              )}

              {/* Create New Option */}
              {allowCreate && search.trim() && !filtered.some((i) => i.name.toLowerCase() === search.toLowerCase()) && (
                <div className="border-t border-gray-100 p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewItem(search);
                      handleCreate();
                      setSearch("");
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Create "{search}"
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
