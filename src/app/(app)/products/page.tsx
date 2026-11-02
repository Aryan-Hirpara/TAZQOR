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
    <div className="min-h-screen">
      <TopHeader
        title="Products & Pack Sizes"
        subtitle="Manage product categories, SKUs, pack variants and batch costs"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Top Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Product Lines
            </span>
            <div className="text-2xl font-black text-[#0A0A0A] mt-1">
              {products.length}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Floor, Dish, Hand, Toilet, Glass</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Active Pack Sizes (SKUs)
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {totalVariantsCount}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">5L Cans, 1L, 500mL Bottles</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Category Management
              </span>
              <p className="text-xs text-gray-700 font-semibold mt-1">Configure catalog categories</p>
            </div>
            <Link
              href="/categories"
              className="px-3.5 py-1.5 rounded-full bg-gray-100 text-gray-800 text-xs font-bold hover:bg-black hover:text-white transition-all"
            >
              Categories
            </Link>
          </div>
        </div>

        {/* Filter and Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-1 items-center gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products, SKUs, pack sizes..."
                className="w-full h-11 pl-10 pr-4 text-xs bg-white rounded-full border border-[#E5E4EE] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4F732] shadow-sm transition-all"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-11 px-3 text-xs bg-white rounded-full border border-[#E5E4EE] text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#D4F732] shadow-sm"
            >
              <option value="all">All Categories</option>
              <option value="cat-floor">Floor Cleaner</option>
              <option value="cat-dish">Dish Wash</option>
              <option value="cat-hand">Hand Wash</option>
              <option value="cat-toilet">Toilet Cleaner</option>
              <option value="cat-glass">Glass Cleaner</option>
            </select>
          </div>

          <Link
            href="/products/new"
            className="flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-[#0A0A0A] text-white text-xs sm:text-sm font-bold shadow-md hover:bg-black/90 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-[#D4F732]" />
            <span>Add Product</span>
          </Link>
        </div>

        {/* Products Grid */}
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-3xl p-6 border border-[#E5E4EE] shadow-sm space-y-4"
            >
              {/* Product Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
                      {product.sku}
                    </span>
                    <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full">
                      {product.category_name}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      HSN: {product.hsn}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mt-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{product.description}</p>
                </div>
              </div>

              {/* Variants & Pack Sizes Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F9F8FD] text-gray-500 font-bold uppercase tracking-wider rounded-xl">
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
                  <tbody className="divide-y divide-gray-100">
                    {product.variants.map((v) => {
                      const marginAmount = v.selling_price - v.cost_price;
                      const marginPct = Math.round((marginAmount / v.selling_price) * 100);

                      return (
                        <tr key={v.id} className="hover:bg-gray-50/60">
                          <td className="py-3 px-4 font-bold text-gray-900 flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-gray-400" />
                            <span>{v.pack_size}</span>
                            <span className="text-[11px] text-gray-500 font-normal">({v.name})</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-gray-600 text-[11px]">{v.sku}</td>
                          <td className="py-3 px-4 text-right text-gray-600">{formatINR(v.cost_price)}</td>
                          <td className="py-3 px-4 text-right font-bold text-gray-900">{formatINR(v.selling_price)}</td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                              +{marginPct}% ({formatINR(marginAmount)})
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`font-extrabold px-2 py-0.5 rounded-full text-xs ${
                                v.current_stock <= v.reorder_level
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {v.current_stock} Units
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-[11px] font-semibold text-gray-600">
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
