"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Tag, Save } from "lucide-react";

interface Coupon {
  id: number;
  code: string;
  description: string | null;
  type: string;
  value: number;
  minOrderValue: number;
  maxDiscount: number | null;
  isFirstOrderOnly: boolean;
  applicableCategories: string | null;
  applicableProducts: string | null;
  isActive: boolean;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<{name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    type: "FLAT",
    value: "",
    minOrderValue: "",
    maxDiscount: "",
    isFirstOrderOnly: false,
    applicableCategories: "",
    applicableProducts: "",
    isActive: true,
    targetType: "ALL"
  });

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      if (data.success) {
        setCoupons(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch coupons", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/homepage-categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchCategories();
  }, []);

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      let target = "ALL";
      if (coupon.isFirstOrderOnly) target = "FIRST_TIME";
      else if (coupon.applicableCategories) target = "CATEGORIES";
      else if (coupon.applicableProducts) target = "PRODUCTS";

      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        description: coupon.description || "",
        type: coupon.type,
        value: coupon.value.toString(),
        minOrderValue: coupon.minOrderValue.toString(),
        maxDiscount: coupon.maxDiscount ? coupon.maxDiscount.toString() : "",
        isFirstOrderOnly: coupon.isFirstOrderOnly,
        applicableCategories: coupon.applicableCategories || "",
        applicableProducts: coupon.applicableProducts || "",
        isActive: coupon.isActive,
        targetType: target
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: "",
        description: "",
        type: "FLAT",
        value: "",
        minOrderValue: "0",
        maxDiscount: "",
        isFirstOrderOnly: false,
        applicableCategories: "",
        applicableProducts: "",
        isActive: true,
        targetType: "ALL"
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        id: editingCoupon?.id,
        value: Number(formData.value),
        minOrderValue: Number(formData.minOrderValue),
        maxDiscount: formData.type === "PERCENTAGE" && formData.maxDiscount ? Number(formData.maxDiscount) : null,
        isFirstOrderOnly: formData.targetType === "FIRST_TIME",
        applicableCategories: formData.targetType === "CATEGORIES" ? formData.applicableCategories : "",
        applicableProducts: formData.targetType === "PRODUCTS" ? formData.applicableProducts : ""
      };

      const res = await fetch("/api/admin/coupons", {
        method: editingCoupon ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        fetchCoupons();
        handleCloseModal();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error("Failed to save coupon", err);
      alert("Failed to save coupon");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchCoupons();
      } else {
        alert("Error deleting coupon");
      }
    } catch (err) {
      console.error("Failed to delete coupon", err);
    }
  };

  if (loading) {
    return <div className="p-8">Loading coupons...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto font-inter">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-brand-dark mb-2">Coupons & Discounts</h1>
          <p className="text-brand-dark/60">Manage your promotional offers and discount codes.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg hover:bg-brand-hover transition-colors shadow-md"
        >
          <Plus size={18} />
          <span>Add Coupon</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fcfaf8] border-b border-black/5 text-xs uppercase tracking-wider text-brand-dark/60">
                <th className="p-4 font-semibold">Code</th>
                <th className="p-4 font-semibold">Type & Value</th>
                <th className="p-4 font-semibold">Conditions</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-brand-dark/40">
                    No coupons created yet. Add one to get started.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-black/5 hover:bg-black/[0.02] transition-colors">
                    <td className="p-4 font-bold text-brand">{coupon.code}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {coupon.type === "PERCENTAGE" ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                        </span>
                        {coupon.type === "PERCENTAGE" && coupon.maxDiscount && (
                          <span className="text-xs text-brand-dark/60">Max: ₹{coupon.maxDiscount}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-brand-dark/80">
                      <div>Min: ₹{coupon.minOrderValue}</div>
                      {coupon.isFirstOrderOnly && <div className="text-brand text-xs font-semibold mt-1">1st Order Only</div>}
                      {coupon.applicableCategories && (
                        <div className="text-xs mt-1 truncate max-w-[200px]" title={coupon.applicableCategories}>
                          Categories: {coupon.applicableCategories}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => handleOpenModal(coupon)} className="text-brand hover:text-brand-hover p-1">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(coupon.id)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-brand-dark/40 mb-2 uppercase tracking-widest">Coupon Code</label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="E.G. FESTIVE15"
                      className="w-full bg-[#f4ece4] border-0 rounded-xl px-4 py-3 text-sm font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand placeholder:text-brand-dark/40 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-brand-dark/40 mb-2 uppercase tracking-widest">Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="e.g. Flat 15% Off above ₹15,000"
                      className="w-full bg-[#f4ece4] border-0 rounded-xl px-4 py-3 text-sm font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand placeholder:text-brand-dark/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-brand-dark/40 mb-2 uppercase tracking-widest">Discount Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full bg-[#f4ece4] border-0 rounded-xl px-4 py-3 text-sm font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      <option value="FLAT">Flat Amount (₹)</option>
                      <option value="PERCENTAGE">Percentage (%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-brand-dark/40 mb-2 uppercase tracking-widest">Discount Value (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder="e.g. 500"
                      className="w-full bg-[#f4ece4] border-0 rounded-xl px-4 py-3 text-sm font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand placeholder:text-brand-dark/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-brand-dark/40 mb-2 uppercase tracking-widest">Min Purchase (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.minOrderValue}
                      onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                      placeholder="e.g. 1999"
                      className="w-full bg-[#f4ece4] border-0 rounded-xl px-4 py-3 text-sm font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand placeholder:text-brand-dark/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 items-end">
                  <div className="flex flex-col justify-end h-full">
                    <label className="block text-[10px] font-black text-brand-dark/40 mb-2 uppercase tracking-widest">
                      Cutoff Price Cap (₹) {formData.type === "FLAT" && "(PERCENTAGE ONLY)"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 20000"
                      disabled={formData.type === "FLAT"}
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                      className="w-full bg-[#f4ece4] border-0 rounded-xl px-4 py-3 text-sm font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand placeholder:text-brand-dark/40 disabled:opacity-50 mt-auto"
                    />
                  </div>
                  <div className="flex flex-col justify-end h-full">
                    <label className="block text-[10px] font-black text-brand-dark/40 mb-2 uppercase tracking-widest">Applicable Customer/Products</label>
                    <select
                      value={formData.targetType}
                      onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                      className="w-full bg-[#f4ece4] border-0 rounded-xl px-4 py-3 text-sm font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand mt-auto"
                    >
                      <option value="ALL">All Purchases</option>
                      <option value="FIRST_TIME">First Time Customer</option>
                      <option value="CATEGORIES">Specific Categories</option>
                      <option value="PRODUCTS">Specific Products</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-end h-full">
                    <label className="block text-[10px] font-black text-brand-dark/40 mb-2 uppercase tracking-widest">Target Criteria {formData.targetType !== "CATEGORIES" && formData.targetType !== "PRODUCTS" && "(NOT REQUIRED)"}</label>
                    {formData.targetType === "CATEGORIES" ? (
                      <select
                        value={formData.applicableCategories}
                        onChange={(e) => setFormData({ ...formData, applicableCategories: e.target.value })}
                        className="w-full bg-[#f4ece4] border-0 rounded-xl px-4 py-3 text-sm font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand mt-auto"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat, idx) => (
                          <option key={idx} value={cat.name.toUpperCase()}>{cat.name}</option>
                        ))}
                      </select>
                    ) : formData.targetType === "PRODUCTS" ? (
                      <input
                        type="text"
                        value={formData.applicableProducts}
                        onChange={(e) => setFormData({ ...formData, applicableProducts: e.target.value })}
                        placeholder="e.g. 1, 2, 5 (comma separated IDs)"
                        className="w-full bg-[#f4ece4] border-0 rounded-xl px-4 py-3 text-sm font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand placeholder:text-brand-dark/40 mt-auto"
                      />
                    ) : (
                      <input
                        type="text"
                        disabled
                        placeholder="No target details needed"
                        className="w-full bg-[#f4ece4] border-0 rounded-xl px-4 py-3 text-sm font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand placeholder:text-brand-dark/40 disabled:opacity-50 mt-auto"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 text-[#0066ff] rounded border-0 bg-[#f4ece4] focus:ring-[#0066ff] focus:ring-2"
                    />
                    <span className="text-xs font-black text-brand-dark uppercase tracking-widest mt-0.5">Enable coupon immediately</span>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-black/5 mt-8">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-full sm:w-[250px] px-8 py-4 rounded-xl text-brand-dark/40 font-black uppercase tracking-widest text-xs border-2 border-brand-dark/5 hover:bg-black/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full flex-1 bg-[#1a2e22] text-white px-8 py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-[#111e16] transition-colors font-black uppercase tracking-widest text-xs shadow-lg active:scale-95"
                  >
                    <Save size={16} />
                    {editingCoupon ? "Save Changes" : "Create Coupon"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
