"use client";

import React, { useState, useEffect } from "react";
import {
  Boxes,
  AlertTriangle,
  Search,
  Edit3,
  Clock,
  CheckCircle2,
  RefreshCw,
  X,
} from "lucide-react";
import { EnrichedInventoryItem } from "@/modules/pharmacy/application/get-inventory.use-case";
import { InventoryFreshnessBadge } from "@/components/pharmacy/inventory-freshness-badge";

export default function InventoryManagementPage() {
  const [items, setItems] = useState<EnrichedInventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit stock modal state
  const [editingItem, setEditingItem] = useState<EnrichedInventoryItem | null>(null);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [updateReason, setUpdateReason] = useState("");
  const [updating, setUpdating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.set("search", search);
      if (lowStockFilter) queryParams.set("lowStock", "true");

      const res = await fetch(`/api/v1/pharmacy/inventory?${queryParams.toString()}`);
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
      }
    } catch (err) {
      console.error("Inventory fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [lowStockFilter]);

  const handleOpenEdit = (i: EnrichedInventoryItem) => {
    setEditingItem(i);
    setNewQuantity(i.item.stockQuantity);
    setUpdateReason("");
    setModalError(null);
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setUpdating(true);
    setModalError(null);

    try {
      const res = await fetch("/api/v1/pharmacy/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryItemId: editingItem.item.id,
          newStockQuantity: Number(newQuantity),
          reason: updateReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to update stock");
      }

      setEditingItem(null);
      await fetchInventory();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Inventory &amp; Stock Freshness
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time medicine stock tracking with audit age thresholds and automated dispense decrements
          </p>
        </div>

        <button
          onClick={fetchInventory}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2 transition-all shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search medicine brand or generic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchInventory()}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base md:text-xs text-slate-900 focus:bg-white focus:border-blue-600 outline-hidden font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 px-3.5 py-2.5 min-h-[44px] rounded-xl border border-slate-200 transition-colors w-full md:w-auto">
            <input
              type="checkbox"
              checked={lowStockFilter}
              onChange={(e) => setLowStockFilter(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
            />
            <span>Low Stock Filter Only</span>
          </label>
        </div>
      </div>

      {/* Mobile Stacked Cards (< 768px) */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            <span>Loading inventory catalog...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            No inventory records match your criteria.
          </div>
        ) : (
          items.map((i) => {
            const item = i.item;
            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{item.medicineName}</h3>
                    <p className="text-xs text-slate-500 font-medium">{item.brandOrGeneric}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xl font-black block ${
                        i.isLowStock ? "text-rose-600" : "text-slate-900"
                      }`}
                    >
                      {item.stockQuantity}
                    </span>
                    <span className="text-[10px] text-slate-400">units</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <InventoryFreshnessBadge freshness={i.freshness} />
                  {i.isLowStock && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 uppercase">
                      Low Stock (&lt;{item.lowStockThreshold})
                    </span>
                  )}
                  {i.freshness.isEstimate && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                      Estimate
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Safety threshold: {item.lowStockThreshold}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(i)}
                    className="px-3.5 py-2 min-h-[44px] rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Adjust</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table (>= 768px) */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-4 px-6">Medicine / Formulation</th>
                <th className="py-4 px-6">Brand / Generic</th>
                <th className="py-4 px-6">Stock Level</th>
                <th className="py-4 px-6">Safety Threshold</th>
                <th className="py-4 px-6">Audit Freshness Badge</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    <span>Loading inventory catalog...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No inventory records match your criteria.
                  </td>
                </tr>
              ) : (
                items.map((i) => {
                  const item = i.item;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                        {item.medicineName}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {item.brandOrGeneric}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-base font-extrabold ${
                              i.isLowStock ? "text-rose-600" : "text-slate-900"
                            }`}
                          >
                            {item.stockQuantity}
                          </span>
                          <span className="text-[11px] text-slate-400">units</span>
                          {i.freshness.isEstimate && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 uppercase">
                              Estimate
                            </span>
                          )}
                          {i.isLowStock && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 uppercase">
                              Low Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-mono">
                        Min {item.lowStockThreshold} units
                      </td>
                      <td className="py-4 px-6">
                        <InventoryFreshnessBadge freshness={i.freshness} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(i)}
                          className="px-3 py-1.5 min-h-[40px] rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Adjust Stock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal (Slide-up bottom sheet on mobile) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Adjust Stock: {editingItem.item.medicineName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Append-only immutable inventory audit entry
                </p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateStock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Stock Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-base sm:text-sm text-slate-900 focus:border-blue-600 outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Adjustment * (Audit mandatory)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physical inventory cycle count, delivery"
                  value={updateReason}
                  onChange={(e) => setUpdateReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-base sm:text-xs text-slate-900 focus:border-blue-600 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2.5 min-h-[48px] text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating || !updateReason.trim()}
                  className="px-5 py-2.5 min-h-[48px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-sm"
                >
                  {updating ? "Saving..." : "Save Stock Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
