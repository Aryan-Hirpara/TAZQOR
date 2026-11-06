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
            className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Products</span>
          </Link>
        </div>

        {/* Add Category Card */}
        <form onSubmit={handleAddCategory} className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 border border-white/65 shadow-none space-y-4">
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-neutral-700" />
            <h2 className="text-base font-normal text-neutral-900">Add New Category</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-light text-neutral-600 mb-1.5">
                Category Name *
              </label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Bathroom Cleaner"
                required
                className="w-full h-10 px-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              />
            </div>

            <div>
              <label className="block text-xs font-light text-neutral-600 mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Short purpose of this product range"
                className="w-full h-10 px-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              />
            </div>
          </div>

          <div className="text-right pt-2">
            <button
              type="submit"
              className="px-5 h-10 rounded-full bg-black text-white text-xs font-normal shadow-md hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#E0FE52]" />
              <span>Add Category</span>
            </button>
          </div>
        </form>

        {/* Categories List */}
        <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 border border-white/65 shadow-none space-y-3">
          <h3 className="text-sm font-normal text-neutral-900 pb-3 border-b border-white/50">
            Configured Categories ({categories.length})
          </h3>

          <div className="divide-y divide-white/40">
            {categories.map((cat) => (
              <div key={cat.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-normal text-neutral-900">{cat.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 text-neutral-700 font-light border border-white/80">
                      {cat.productCount} Products
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 font-light">{cat.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-neutral-500">Order: #{cat.sortOrder}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

