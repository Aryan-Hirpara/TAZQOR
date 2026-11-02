"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, FolderTree, Tag, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";

interface CategoryItem {
  id: string;
  name: string;
  description: string;
  productCount: number;
  sortOrder: number;
}

const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: "cat-floor", name: "Floor Cleaner", description: "Disinfectants, tile cleaners and surface sanitizers", productCount: 2, sortOrder: 1 },
  { id: "cat-dish", name: "Dish Wash", description: "Concentrated gels, grease removers and kitchen detergents", productCount: 2, sortOrder: 2 },
  { id: "cat-hand", name: "Hand Wash", description: "Anti-bacterial hand washes, foaming liquids and refills", productCount: 2, sortOrder: 3 },
  { id: "cat-toilet", name: "Toilet Cleaner", description: "Thick descaling acid and non-acid bathroom toilet bowl cleaners", productCount: 2, sortOrder: 4 },
  { id: "cat-glass", name: "Glass Cleaner", description: "Streak-free shine solutions for windows, glass and chrome", productCount: 2, sortOrder: 5 },
  { id: "cat-car", name: "Car Wash", description: "Automotive high-foam shampoos and exterior cleaners", productCount: 1, sortOrder: 6 },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error("Please enter category name");
      return;
    }

    const newCat: CategoryItem = {
      id: "cat-" + Date.now(),
      name: newCatName.trim(),
      description: newCatDesc.trim() || "Cleaning category",
      productCount: 0,
      sortOrder: categories.length + 1,
    };

    setCategories([...categories, newCat]);
    setNewCatName("");
    setNewCatDesc("");
    toast.success(`Category "${newCat.name}" added`);
  };

  return (
    <div className="min-h-screen">
      <TopHeader
        title="Product Categories"
        subtitle="Manage product hierarchy and classification"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        <div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Products</span>
          </Link>
        </div>

        {/* Add Category Card */}
        <form onSubmit={handleAddCategory} className="bg-white rounded-3xl p-6 border border-[#E5E4EE] shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-gray-700" />
            <h2 className="text-base font-bold text-gray-900">Add New Category</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Category Name *
              </label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Bathroom Cleaner"
                required
                className="w-full h-11 px-4 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Short purpose of this product range"
                className="w-full h-11 px-4 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
              />
            </div>
          </div>

          <div className="text-right pt-2">
            <button
              type="submit"
              className="px-5 h-10 rounded-full bg-[#0A0A0A] text-white text-xs font-bold shadow-sm hover:bg-black/90 active:scale-95 transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4F732]" />
              <span>Add Category</span>
            </button>
          </div>
        </form>

        {/* Categories List */}
        <div className="bg-white rounded-3xl p-6 border border-[#E5E4EE] shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-gray-900 pb-3 border-b border-gray-100">
            Configured Categories ({categories.length})
          </h3>

          <div className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <div key={cat.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{cat.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                      {cat.productCount} Products
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{cat.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-gray-400">Order: #{cat.sortOrder}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
