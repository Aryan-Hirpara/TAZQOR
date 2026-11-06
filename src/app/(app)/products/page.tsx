"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Search,
  Plus,
  Package,
  Boxes,
  TrendingUp,
  Tag,
  AlertCircle,
  FolderTree,
} from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";
import { getProducts, Product } from "@/lib/services/products";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getProducts({ search, categoryId: selectedCategory });
      setProducts(data);
      setLoading(false);
    }
    load();
  }, [search, selectedCategory]);

  const totalVariantsCount = products.reduce((acc, p) => acc + p.variants.length, 0);

  return (
    <div className="min-h-screen pb-12">
      <TopHeader title="Products & Packs" />

      <div className="space-y-6 pt-2">
        {/* Top Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-6 shadow-sm">
            <span className="text-xs font-light text-neutral-500 block">
              Product lines
            </span>
            <div className="text-3xl font-normal text-neutral-900 mt-1 tracking-tight">
              {products.length}
            </div>
            <p className="text-[11px] font-light text-neutral-500 mt-0.5">Floor, Dish, Hand, Toilet, Glass</p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-6 shadow-sm">
            <span className="text-xs font-light text-neutral-500 block">
              Active pack sizes (SKUs)
            </span>
            <div className="text-3xl font-normal text-emerald-800 mt-1 tracking-tight">
              {totalVariantsCount}
            </div>
            <p className="text-[11px] font-light text-neutral-500 mt-0.5">5L Cans, 1L, 500mL Bottles</p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-6 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-light text-neutral-500 block">
                Category management
              </span>
              <p className="text-sm text-neutral-900 font-normal mt-0.5">Configure catalog categories</p>
            </div>
            <Link
              href="/categories"
              className="px-4 min-h-[44px] flex items-center justify-center rounded-full bg-white/70 text-neutral-800 text-xs font-light border border-white/80 hover:bg-black hover:text-white transition-all shadow-sm cursor-pointer"
            >
              Categories
            </Link>
          </div>
        </div>

        {/* Filter and Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-1 items-center gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products, SKUs, pack sizes..."
                className="w-full h-10 pl-10 pr-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E0FE52] shadow-sm transition-all"
              />
            </div>

            <select
              aria-label="Filter products by category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 px-3.5 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-700 font-light focus:outline-none focus:ring-2 focus:ring-[#E0FE52] shadow-sm"
            >
              <option value="all">All categories</option>
              <option value="cat-floor">Floor Cleaner</option>
              <option value="cat-dish">Dish Wash</option>
              <option value="cat-hand">Hand Wash</option>
              <option value="cat-toilet">Toilet Cleaner</option>
              <option value="cat-glass">Glass Cleaner</option>
            </select>
          </div>

          <Link
            href="/products/new"
            className="flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-black text-white text-xs sm:text-sm font-normal shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-[#E0FE52]" />
            <span>Add Product</span>
          </Link>
        </div>

        {/* Products Grid */}
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 border border-white/65 shadow-sm space-y-4"
            >
              {/* Product Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/70 text-neutral-700 font-normal border border-white/80">
                      {product.sku}
                    </span>
                    <span className="text-[11px] font-light text-neutral-700 bg-white/70 px-2.5 py-0.5 rounded-full border border-white/80">
                      {product.category_name}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      HSN: {product.hsn}
                    </span>
                  </div>
                  <h3 className="text-base font-normal text-neutral-900 mt-1">
                    {product.name}
                  </h3>
                  <p className="text-xs font-light text-neutral-500 mt-0.5">{product.description}</p>
                </div>
              </div>

              {/* Variants & Pack Sizes Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/40 text-neutral-500 font-normal rounded-xl border-b border-white/50">
                    <tr>
                      <th className="py-2.5 px-4 rounded-l-xl">Pack Size</th>
                      <th className="py-2.5 px-4">Variant SKU</th>
                      <th className="py-2.5 px-4 text-right">Cost Price</th>
                      <th className="py-2.5 px-4 text-right">Selling Price</th>
                      <th className="py-2.5 px-4 text-right">Gross Margin</th>
                      <th className="py-2.5 px-4 text-right">Stock On Hand</th>
                      <th className="py-2.5 px-4 rounded-r-xl text-center">Tax Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/40">
                    {product.variants.map((v) => {
                      const marginAmount = v.selling_price - v.cost_price;
                      const marginPct = Math.round((marginAmount / v.selling_price) * 100);

                      return (
                        <tr key={v.id} className="hover:bg-white/40 transition-colors">
                          <td className="py-3 px-4 font-normal text-neutral-900 flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-neutral-400" />
                            <span>{v.pack_size}</span>
                            <span className="text-[11px] text-neutral-500 font-light">({v.name})</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-neutral-500 text-[11px]">{v.sku}</td>
                          <td className="py-3 px-4 text-right text-neutral-600 font-light">{formatINR(v.cost_price)}</td>
                          <td className="py-3 px-4 text-right font-medium text-neutral-900">{formatINR(v.selling_price)}</td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-normal bg-white/70 text-neutral-800 border border-white/80">
                              +{marginPct}% ({formatINR(marginAmount)})
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`font-medium px-2.5 py-0.5 rounded-full text-xs ${
                                v.current_stock <= v.reorder_level
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-white/80 text-neutral-800 border border-white/90"
                              }`}
                            >
                              {v.current_stock} Units
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-[11px] font-light text-neutral-600">
                              {v.tax_rate}% GST
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

