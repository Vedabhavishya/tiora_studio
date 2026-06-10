"use client";

import { useState, useEffect } from "react";
import { 
  Save, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  Check, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUp, 
  ArrowDown, 
  ImageIcon, 
  ExternalLink 
} from "lucide-react";
import { useRouter } from "next/navigation";

interface HomepageCategory {
  id: number;
  name: string;
  imageUrl: string;
  promoText: string;
  actionText: string;
  link: string | null;
  order: number;
  filterTypes?: string | null;
}

export default function CategorySettingsPage() {
  const router = useRouter();
  
  // State
  const [categories, setCategories] = useState<HomepageCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  
  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [promoText, setPromoText] = useState("");
  const [actionText, setActionText] = useState("Shop Now");
  const [link, setLink] = useState("");
  const [order, setOrder] = useState(0);
  const [filterTypes, setFilterTypes] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/homepage-categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      } else {
        setError(data.error || "Failed to load categories.");
      }
      
      if (res.status === 401) {
        router.push("/admin/login");
      }
    } catch (err) {
      setError("Failed to fetch homepage categories.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setImageUrl("");
    setPromoText("");
    setActionText("Shop Now");
    setLink("");
    setOrder(categories.length);
    setFilterTypes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !imageUrl.trim() || !promoText.trim()) return;

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const payload = {
      id: editingId,
      name: name.trim(),
      imageUrl: imageUrl.trim(),
      promoText: promoText.trim(),
      actionText: actionText.trim() || "Shop Now",
      link: link.trim() || null,
      order: Number(order) || 0,
      filterTypes: filterTypes.trim() || null,
    };

    try {
      const url = "/api/admin/homepage-categories";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccess(editingId ? "Category card updated successfully!" : "Category card created successfully!");
        resetForm();
        fetchData();
        router.refresh();
      } else {
        setError(data.error || "Failed to save category card.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (item: HomepageCategory) => {
    setEditingId(item.id);
    setName(item.name);
    setImageUrl(item.imageUrl);
    setPromoText(item.promoText);
    setActionText(item.actionText);
    setLink(item.link || "");
    setOrder(item.order);
    setFilterTypes(item.filterTypes || "");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category card?")) return;

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/homepage-categories?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccess("Category card deleted successfully!");
        fetchData();
        router.refresh();
      } else {
        setError(data.error || "Failed to delete category card.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReorder = async (currentIndex: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const listCopy = [...categories];
    // Swap items
    const temp = listCopy[currentIndex];
    listCopy[currentIndex] = listCopy[targetIndex];
    listCopy[targetIndex] = temp;

    // Reassign order properties sequentially
    const updatedList = listCopy.map((item, index) => ({
      ...item,
      order: index,
    }));

    setCategories(updatedList);

    try {
      const res = await fetch("/api/admin/homepage-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedList.map(item => ({ id: item.id, order: item.order }))),
      });
      const data = await res.json();
      if (!data.success) {
        setError("Failed to save new order.");
        fetchData(); // Rollback UI
      }
    } catch (err) {
      setError("Failed to save reorder state.");
      fetchData();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-[#C5A059] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-10">
      <div className="mb-10">
        <h1 className="text-4xl font-playfair font-bold text-brand">Category Banner Settings</h1>
        <p className="mt-2 text-brand/60 font-medium tracking-tight flex items-center">
          <Sparkles size={16} className="text-[#C5A059] mr-2" />
          Add and manage promo category grid blocks positioned on your storefront home page.
        </p>
      </div>

      {/* Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center space-x-3 text-green-600 animate-in fade-in">
          <Check size={20} />
          <span className="text-sm font-bold uppercase tracking-wider">{success}</span>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-3 text-red-500 animate-in fade-in">
          <AlertCircle size={20} />
          <span className="text-sm font-bold uppercase tracking-wider">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Editor Form - 5 Cols */}
        <div className="lg:col-span-5 bg-white rounded-[2.5rem] p-8 shadow-sm border border-brand/5 h-fit">
          <h2 className="text-xl font-playfair font-bold text-brand mb-6 border-b border-brand/5 pb-4">
            {editingId ? "Edit Category Card" : "Add New Category Card"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2 ml-1">
                Category Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ethnic Wear"
                className="w-full bg-brand/5 border border-transparent focus:border-[#C5A059]/50 rounded-2xl px-5 py-3.5 text-sm font-semibold text-brand outline-none transition-all placeholder:text-brand/20"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2 ml-1">
                Category Image URL
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="e.g. https://images.unsplash.com/... or /images/..."
                className="w-full bg-brand/5 border border-transparent focus:border-[#C5A059]/50 rounded-2xl px-5 py-3.5 text-sm font-semibold text-brand outline-none transition-all placeholder:text-brand/20"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2 ml-1">
                Promo/Discount Matter
              </label>
              <input
                type="text"
                value={promoText}
                onChange={(e) => setPromoText(e.target.value)}
                placeholder="e.g. 50-80% OFF"
                className="w-full bg-brand/5 border border-transparent focus:border-[#C5A059]/50 rounded-2xl px-5 py-3.5 text-sm font-semibold text-brand outline-none transition-all placeholder:text-brand/20"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2 ml-1">
                  Action Button text
                </label>
                <input
                  type="text"
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                  placeholder="Shop Now"
                  className="w-full bg-brand/5 border border-transparent focus:border-[#C5A059]/50 rounded-2xl px-5 py-3.5 text-sm font-semibold text-brand outline-none transition-all placeholder:text-brand/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2 ml-1">
                  Order Index
                </label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-brand/5 border border-transparent focus:border-[#C5A059]/50 rounded-2xl px-5 py-3.5 text-sm font-semibold text-brand outline-none transition-all placeholder:text-brand/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2 ml-1">
                Link URL
              </label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="e.g. /category/ethnic-wear"
                className="w-full bg-brand/5 border border-transparent focus:border-[#C5A059]/50 rounded-2xl px-5 py-3.5 text-sm font-semibold text-brand outline-none transition-all placeholder:text-brand/20"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2 ml-1">
                Type Filter Options
              </label>
              <input
                type="text"
                value={filterTypes}
                onChange={(e) => setFilterTypes(e.target.value)}
                placeholder="e.g. T-Shirt, Shirt, Pants"
                className="w-full bg-brand/5 border border-transparent focus:border-[#C5A059]/50 rounded-2xl px-5 py-3.5 text-sm font-semibold text-brand outline-none transition-all placeholder:text-brand/20"
              />
              <p className="mt-1.5 text-[9px] text-brand/40 font-medium leading-relaxed">
                Enter comma-separated product types to show in the category page sidebar filter. Leave blank to automatically classify products dynamically based on default keywords.
              </p>
            </div>

            {/* Live Mockup Preview inside Form */}
            <div className="border border-brand/10 rounded-3xl p-4 bg-brand-light">
              <span className="block text-[8px] font-black text-brand/40 uppercase tracking-[0.2em] mb-3 ml-1">
                Live Card Mockup Preview
              </span>
              
              <div className="relative mx-auto w-48 aspect-[4/5] rounded-2xl overflow-hidden shadow-lg bg-gray-100 flex flex-col justify-end border border-brand/5 group">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Mockup Preview"
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/images/placeholder.png";
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-brand/20">
                    <ImageIcon size={32} />
                    <span className="text-[9px] uppercase tracking-widest font-black mt-2">No Image</span>
                  </div>
                )}
                
                {/* Overlay Card */}
                <div className="relative z-10 w-full p-2.5 bg-[#064e3b] text-white rounded-t-xl text-center flex flex-col items-center justify-center">
                  <span className="text-[9px] tracking-wide uppercase font-medium text-center w-full block break-words">
                    {name || "Category Name"}
                  </span>
                  <span className="text-base font-bold tracking-tight leading-tight my-0.5 uppercase text-center w-full block break-words">
                    {promoText || "Promo Text"}
                  </span>
                  <span className="text-[8px] font-bold tracking-widest uppercase opacity-90 border-t border-white/20 pt-1 mt-1 w-full block">
                    {actionText || "Shop Now"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center space-x-2 bg-[#1B3022] text-[#C5A059] py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#2c4d37] transition-all shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                <span>{editingId ? "Save Changes" : "Create Card"}</span>
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-4 border border-brand/10 text-brand/60 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand/5 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Existing Grid List - 7 Cols */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-brand/5">
            <h2 className="text-xl font-playfair font-bold text-brand mb-6 border-b border-brand/5 pb-4">
              Active Category Cards ({categories.length})
            </h2>

            {categories.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-brand/10 rounded-[2rem] bg-brand-light flex flex-col items-center">
                <ImageIcon className="w-10 h-10 text-brand/20 mb-4" />
                <p className="text-sm font-bold text-brand">No Category Cards Added Yet</p>
                <p className="text-xs text-brand/40 mt-1">Fill out the editor form on the left to add your first category banner block.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {categories.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="relative border border-brand/5 bg-brand-light/40 rounded-3xl p-5 flex flex-col group hover:shadow-md transition-all duration-300"
                  >
                    {/* Visual Card Display */}
                    <div className="flex gap-4">
                      <div className="w-24 aspect-[4/5] bg-white rounded-2xl overflow-hidden shadow-sm border border-brand/5 relative flex-shrink-0">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                          onError={e => (e.currentTarget.src = "/images/placeholder.png")}
                        />
                      </div>
                      
                      {/* Info & Metadata */}
                      <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                        <div>
                          <h3 className="font-playfair font-bold text-brand text-lg truncate leading-tight">{item.name}</h3>
                          <p className="text-[#064e3b] text-xs font-bold uppercase tracking-wider mt-1">{item.promoText}</p>
                          <span className="text-[10px] text-brand/40 uppercase tracking-widest font-black block mt-2">
                            Link: <span className="text-brand/60 font-semibold lowercase tracking-normal truncate inline-block max-w-[120px] align-middle">{item.link || "none"}</span>
                          </span>
                        </div>

                        {/* Control Actions */}
                        <div className="flex items-center space-x-2 mt-4">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="p-2.5 bg-white text-brand hover:text-[#C5A059] rounded-xl shadow-sm border border-brand/5 hover:scale-105 transition-all"
                            title="Edit Card"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2.5 bg-white text-red-500 hover:bg-red-50 rounded-xl shadow-sm border border-brand/5 hover:scale-105 transition-all"
                            title="Delete Card"
                          >
                            <Trash2 size={14} />
                          </button>

                          {/* Order Buttons */}
                          <div className="h-px w-4 bg-brand/5 ml-2 mr-1"></div>
                          <button
                            onClick={() => handleReorder(index, "up")}
                            disabled={index === 0}
                            className="p-2 bg-white text-brand hover:text-[#C5A059] rounded-xl shadow-sm border border-brand/5 disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            onClick={() => handleReorder(index, "down")}
                            disabled={index === categories.length - 1}
                            className="p-2 bg-white text-brand hover:text-[#C5A059] rounded-xl shadow-sm border border-brand/5 disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
