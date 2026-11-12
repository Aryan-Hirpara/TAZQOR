"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FolderPlus, Layers, Lock, Package, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TopHeader } from "@/components/layout/TopHeader";
import { createClient } from "@/lib/supabase/client";
import {
  COMBO_PACK_CATEGORY_DESCRIPTION,
  COMBO_PACK_CATEGORY_NAME,
  isComboPackCategoryName,
} from "@/lib/products/combo-pack";

const BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  sort_order: number | null;
  productCount: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const [{ data: catData, error: catErr }, { data: prodData, error: prodErr }] =
        await Promise.all([
          supabase
            .from("categories")
            .select("id, name, description, sort_order")
            .eq("business_id", BUSINESS_ID)
            .order("sort_order", { ascending: true })
            .order("name", { ascending: true }),
          supabase
            .from("products")
            .select("id, category_id")
            .eq("business_id", BUSINESS_ID)
            .neq("status", "archived"),
        ]);

      if (catErr) throw catErr;
      if (prodErr) throw prodErr;

      const countMap: Record<string, number> = {};
      (prodData || []).forEach((p: { id: string; category_id: string | null }) => {
        if (p.category_id) {
          countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
        }
      });

      const rows = (catData || []) as Array<{
        id: string;
        name: string;
        description: string | null;
        sort_order: number | null;
      }>;

      // Ensure the permanent Combo Pack category is always available
      if (!rows.some((c) => isComboPackCategoryName(c.name))) {
        const nextSort =
          rows.reduce((max, c) => Math.max(max, c.sort_order ?? 0), 0) + 1;
        const { data: insertedCombo } = await supabase
          .from("categories")
          .insert({
            business_id: BUSINESS_ID,
            name: COMBO_PACK_CATEGORY_NAME,
            description: COMBO_PACK_CATEGORY_DESCRIPTION,
            sort_order: nextSort,
          })
          .select("id, name, description, sort_order")
          .maybeSingle();

        if (insertedCombo) {
          rows.push(insertedCombo);
        }
      }

      const merged: CategoryRow[] = rows.map((c) => ({
        ...c,
        productCount: countMap[c.id] || 0,
      }));

      setCategories(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setCreating(true);
    setError(null);
    try {
      const supabase = createClient();
      const nextSort =
        categories.reduce((max, c) => Math.max(max, c.sort_order ?? 0), 0) + 1;

      const { error: insertErr } = await supabase.from("categories").insert({
        business_id: BUSINESS_ID,
        name: trimmedName,
        description: description.trim() || null,
        sort_order: nextSort,
      });

      if (insertErr) throw insertErr;
      setName("");
      setDescription("");
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setCreating(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const supabase = createClient();
      if (isComboPackCategoryName(deleteTarget.name)) {
        throw new Error(
          `"${deleteTarget.name}" is a permanent system category for Combo Packs and cannot be removed.`
        );
      }
      if (deleteTarget.productCount > 0) {
        throw new Error(
          `Cannot delete "${deleteTarget.name}" while ${deleteTarget.productCount} active product(s) use it. Archive or reassign those products first.`
        );
      }
      const { data: deleted, error: delErr } = await supabase
        .from("categories")
        .delete()
        .eq("id", deleteTarget.id)
        .eq("business_id", BUSINESS_ID)
        .select("id");

      if (delErr) throw delErr;
      if (!deleted || deleted.length === 0) {
        throw new Error("Category could not be deleted or was already removed.");
      }
      setDeleteTarget(null);
      await loadCategories();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen pb-12">
      <TopHeader title="Product Categories" subtitle="Live Catalog Grouping" />
      <div className="space-y-6 pt-2 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#6B6A66] hover:text-[#111214] transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
          </Link>
          <h1 className="text-[22px] font-medium text-[#111214] tracking-[-0.02em]">
            Product Categories
          </h1>
          <p className="text-[12px] text-[#6B6A66] mt-0.5">
            Organize your product catalog into live categories stored in Supabase.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-[16px] bg-red-50 border border-red-200 px-4 py-3 text-[12px] text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <GlassCard className="lg:col-span-4 p-5 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#D7FF00] flex items-center justify-center text-[#111214]">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-medium text-[#111214]">Add Category</h2>
              <p className="text-[11px] text-[#6B6A66]">Create a new catalog group</p>
            </div>
          </div>

          <form onSubmit={handleAddCategory} className="space-y-3.5">
            <div>
              <label
                htmlFor="cat-name"
                className="block text-[11px] font-medium text-[#6B6A66] mb-1"
              >
                Category Name *
              </label>
              <input
                id="cat-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Surface Cleaners"
                className="w-full h-10 px-3.5 rounded-full bg-white/80 border border-black/10 text-[13px] text-[#111214] focus:outline-none focus:ring-2 focus:ring-[#111214]/15"
              />
            </div>

            <div>
              <label
                htmlFor="cat-desc"
                className="block text-[11px] font-medium text-[#6B6A66] mb-1"
              >
                Description
              </label>
              <textarea
                id="cat-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes on products in this category"
                className="w-full px-3.5 py-2.5 rounded-[16px] bg-white/80 border border-black/10 text-[13px] text-[#111214] focus:outline-none focus:ring-2 focus:ring-[#111214]/15 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="w-full h-10 rounded-full bg-[#111214] text-white text-[13px] font-medium hover:bg-[#2a2b2f] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {creating ? "Saving..." : "Create Category"}
            </button>
          </form>
        </GlassCard>

        <GlassCard className="lg:col-span-8 p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#6B6A66]" />
              <h2 className="text-[15px] font-medium text-[#111214]">
                Active Categories ({categories.length})
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-[13px] text-[#6B6A66]">
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-black/10 rounded-[20px]">
              <Layers className="w-8 h-8 text-[#9E9D98] mx-auto mb-2" />
              <p className="text-[14px] font-medium text-[#111214]">No categories yet</p>
              <p className="text-[12px] text-[#6B6A66] mt-1">
                Add your first product category using the form on the left.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-4 rounded-[20px] bg-white/65 border border-black/[0.06] flex flex-col justify-between gap-3 min-w-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[14px] font-medium text-[#111214] truncate">
                        {cat.name}
                      </h3>
                      <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/[0.05] text-[11px] font-medium text-[#111214]">
                        <Package className="w-3 h-3" />
                        {cat.productCount}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#6B6A66] mt-1 line-clamp-2 break-words">
                      {cat.description || "No description provided"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/[0.05]">
                    <Link
                      href={`/products?category=${cat.id}`}
                      className="text-[11px] font-medium text-[#111214] hover:underline"
                    >
                      View Products
                    </Link>
                    {isComboPackCategoryName(cat.name) ? (
                      <span
                        title="Permanent category required for Combo Packs"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/[0.06] text-[11px] font-medium text-[#111214]"
                      >
                        <Lock className="w-3 h-3" /> Permanent
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(cat);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Remove category "${deleteTarget?.name ?? ""}"?`}
        description={
          deleteTarget && deleteTarget.productCount > 0
            ? `This category currently has ${deleteTarget.productCount} active product(s). Archive or move them before removing.`
            : "This permanently deletes the category from your catalog."
        }
        confirmLabel="Remove Category"
        tone="danger"
        loading={deleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
      </div>
    </div>
  );
}
