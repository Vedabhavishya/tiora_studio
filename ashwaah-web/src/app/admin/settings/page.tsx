"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Upload, Sparkles, AlertCircle, Check, Image as ImageIcon, Plus, Trash2, Megaphone } from "lucide-react";
import { useRouter } from "next/navigation";

interface Offer {
  id: number;
  text: string;
  link: string | null;
  order: number;
}

function parseOfferText(text: string) {
  if (text.includes("|")) {
    const parts = text.split("|");
    return { title: parts[0].trim(), subtitle: parts[1].trim() };
  }
  if (text.includes("!")) {
    const parts = text.split("!");
    const title = parts[0].trim();
    const subtitle = parts.slice(1).join("!").trim();
    return { title, subtitle: subtitle || null };
  }
  return { title: text.trim(), subtitle: null };
}

export default function SettingsPage() {
  const router = useRouter();
  const [bannerUrl, setBannerUrl] = useState("");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // New offer form state
  const [newOfferText, setNewOfferText] = useState("");
  const [newOfferSubtext, setNewOfferSubtext] = useState("");
  const [newOfferLink, setNewOfferLink] = useState("");

  const fetchData = async () => {
    try {
      // Fetch Homepage Banner
      const resBanner = await fetch("/api/admin/settings?key=homepage_banner");
      const dataBanner = await resBanner.json();
      if (dataBanner.success && dataBanner.data) {
        setBannerUrl(dataBanner.data.value);
      }

      // Fetch Offers
      const resOffers = await fetch("/api/admin/offers");
      const dataOffers = await resOffers.json();
      if (dataOffers.success) {
        setOffers(dataOffers.data);
      }

      if (resBanner.status === 401 || resOffers.status === 401) {
        router.push("/admin/login");
      }
    } catch (err) {
      setError("Failed to load settings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setBannerUrl(data.url);
        setSuccess("Image uploaded successfully!");
      } else {
        setError(data.error || "Failed to upload image.");
      }
    } catch (err) {
      setError("An error occurred during file upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "homepage_banner",
          value: bannerUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Banner setting saved successfully!");
        router.refresh();
      } else {
        setError(data.error || "Failed to save settings.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfferText.trim()) return;

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const combinedText = newOfferSubtext.trim()
      ? `${newOfferText.trim()} | ${newOfferSubtext.trim()}`
      : newOfferText.trim();

    try {
      const res = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: combinedText,
          link: newOfferLink || null,
          order: offers.length,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Offer banner added successfully!");
        setNewOfferText("");
        setNewOfferSubtext("");
        setNewOfferLink("");
        fetchData();
        router.refresh();
      } else {
        setError(data.error || "Failed to add offer.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOffer = async (id: number) => {
    if (!confirm("Are you sure you want to delete this offer banner?")) return;

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/offers?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Offer banner deleted successfully!");
        fetchData();
        router.refresh();
      } else {
        setError(data.error || "Failed to delete offer.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
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
        <h1 className="text-4xl font-playfair font-bold text-brand">Site Settings</h1>
        <p className="mt-2 text-brand/60 font-medium tracking-tight flex items-center">
          <Sparkles size={16} className="text-[#C5A059] mr-2" />
          Customize the aesthetic and layout options of your storefront.
        </p>
      </div>

      {/* Alerts */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Settings Form Column */}
        <div className="space-y-10">
          
          {/* Banner Setting Form */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-brand/5">
            <h2 className="text-xl font-playfair font-bold text-brand mb-6 border-b border-brand/5 pb-4">Homepage Hero Banner</h2>
            
            <form onSubmit={handleSaveBanner} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-3 ml-1">Banner Image URL</label>
                <input
                  type="text"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="e.g. /images/hero_banner.jpg or paste external URL"
                  className="w-full bg-brand/5 border border-transparent focus:border-[#C5A059]/50 rounded-2xl px-5 py-4 text-sm font-semibold text-brand outline-none transition-all placeholder:text-brand/20"
                />
              </div>

              <div className="relative border-2 border-dashed border-brand/10 hover:border-[#C5A059]/30 rounded-2xl p-8 text-center transition-all bg-brand/5">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="p-4 bg-white rounded-2xl shadow-sm text-brand">
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-[#C5A059]" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand">Click to Upload Banner Image</p>
                    <p className="text-xs text-brand/40 mt-1">PNG, JPG, JPEG or WEBP up to 5MB</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="w-full flex items-center justify-center space-x-2 bg-[#1B3022] text-[#C5A059] py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#2c4d37] transition-all shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                <span>Save Banner Setting</span>
              </button>
            </form>
          </div>

          {/* Offer Ticker Settings Form */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-brand/5">
            <h2 className="text-xl font-playfair font-bold text-brand mb-6 border-b border-brand/5 pb-4">Offer Announcement Carousel</h2>
            
            <form onSubmit={handleAddOffer} className="space-y-4 mb-8">
              <div>
                <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2 ml-1">Add Offer Banner Text</label>
                <input
                  type="text"
                  value={newOfferText}
                  onChange={(e) => setNewOfferText(e.target.value)}
                  placeholder="e.g. FLAT ₹500 OFF"
                  className="w-full bg-brand/5 border border-transparent focus:border-[#C5A059]/50 rounded-2xl px-5 py-3.5 text-xs font-semibold text-brand outline-none transition-all placeholder:text-brand/20"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2 ml-1">Add Offer Banner Subtext (Optional)</label>
                <input
                  type="text"
                  value={newOfferSubtext}
                  onChange={(e) => setNewOfferSubtext(e.target.value)}
                  placeholder="e.g. On First Purchase"
                  className="w-full bg-brand/5 border border-transparent focus:border-[#C5A059]/50 rounded-2xl px-5 py-3.5 text-xs font-semibold text-brand outline-none transition-all placeholder:text-brand/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-brand/40 uppercase tracking-[0.2em] mb-2 ml-1">Link Target URL (Optional)</label>
                <input
                  type="text"
                  value={newOfferLink}
                  onChange={(e) => setNewOfferLink(e.target.value)}
                  placeholder="e.g. /category/mens"
                  className="w-full bg-brand/5 border border-transparent focus:border-[#C5A059]/50 rounded-2xl px-5 py-3.5 text-xs font-semibold text-brand outline-none transition-all placeholder:text-brand/20"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-2 bg-[#C5A059] text-white py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#b39150] transition-all shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                <span>Add Offer Slide</span>
              </button>
            </form>

            {/* List of current offers */}
            <div>
              <p className="text-[10px] font-black text-brand/40 uppercase tracking-[0.25em] mb-4 border-b border-brand/5 pb-2">Active Slides ({offers.length})</p>
              
              {offers.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-brand/10 rounded-2xl text-brand/30">
                  <Megaphone className="mx-auto mb-2 text-brand/20" size={24} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No active offer slides</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {offers.map((offer) => (
                    <div key={offer.id} className="flex items-center justify-between p-4 bg-brand/5 border border-brand/5 rounded-2xl group transition-all hover:bg-brand/10">
                      <div className="flex-1 min-w-0 pr-4">
                        {(() => {
                          const { title, subtitle } = parseOfferText(offer.text);
                          return (
                            <p className="text-xs font-bold text-brand truncate">
                              {title}
                              {subtitle && (
                                <span className="text-brand/40 font-medium ml-2">
                                  ({subtitle})
                                </span>
                              )}
                            </p>
                          );
                        })()}
                        {offer.link && (
                          <p className="text-[9px] font-black text-[#C5A059] uppercase tracking-wider mt-1 truncate">Link: {offer.link}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteOffer(offer.id)}
                        disabled={isSubmitting}
                        className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-brand/5 flex flex-col h-fit">
          <h2 className="text-xl font-playfair font-bold text-brand mb-6 border-b border-brand/5 pb-4">Aesthetic Offer & Banner Preview</h2>
          
          <div className="rounded-2xl border border-brand/10 overflow-hidden relative flex flex-col p-0 bg-brand/5">

            {/* 2. Offer Carousel Banner Mockup (1cm to 2cm) */}
            <div className="h-16 bg-[#F5EBE0] text-[#3E5622] flex items-center justify-center px-4 relative z-10 shadow-sm border-b border-[#3E5622]/10">
              {offers.length > 0 ? (
                (() => {
                  const { title, subtitle } = parseOfferText(offers[0].text);
                  return (
                    <div className={`relative flex items-center h-12 bg-[#3E5622] text-white px-6 rounded-l-xl rounded-r-md shadow-md overflow-hidden font-inter ${!subtitle ? "justify-center" : ""}`}>
                      {/* Left Title */}
                      <span className={`font-extrabold text-sm md:text-base uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap ${subtitle ? "pr-4" : ""}`}>
                        {title}
                      </span>
                      
                      {subtitle && (
                        <>
                          {/* Dashed Divider with top/bottom circular cutouts */}
                          <div className="relative h-full flex items-center px-1">
                            <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#F5EBE0] rounded-full"></div>
                            <div className="h-3/5 border-l border-dashed border-white/50"></div>
                            <div className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#F5EBE0] rounded-full"></div>
                          </div>
                          
                          {/* Right Subtitle */}
                          <span className="text-[10px] md:text-xs font-black uppercase tracking-widest pl-3 pr-2 opacity-95 whitespace-nowrap">
                            {subtitle}
                          </span>
                        </>
                      )}

                      {/* Jagged right edge (torn coupon effect) */}
                      <div className="absolute right-0 top-0 bottom-0 w-1 flex flex-col justify-between py-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="w-1 h-1.5 bg-[#F5EBE0] rounded-l-full"></div>
                        ))}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p className="text-[11px] md:text-[12px] font-black uppercase tracking-[0.25em] text-white/40">
                  Carousel Slide Offers Area (1 - 2 CM Height)
                </p>
              )}
            </div>

            {/* 3. Promo Banner Preview Section */}
            {bannerUrl ? (
              <div className="relative w-full overflow-hidden bg-white">
                <img
                  src={bannerUrl}
                  alt="Banner Preview"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-brand/30 border-dashed bg-white space-y-1">
                <ImageIcon size={20} />
                <p className="text-[9px] font-bold uppercase tracking-widest">No Promo Banner Selected</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
