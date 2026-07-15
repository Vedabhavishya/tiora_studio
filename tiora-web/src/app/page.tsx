"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, User, Phone, MessageSquare, ChevronDown } from "lucide-react";

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

export default function Home() {
  const [bannerUrl, setBannerUrl] = useState("");
  const [offers, setOffers] = useState<any[]>([]);
  const [homepageCatCards, setHomepageCatCards] = useState<any[]>([]);
  const [navCategories, setNavCategories] = useState<any[]>([]);

  // Appointment booking form state variables
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingName, setBookingName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");
  const [dateError, setDateError] = useState("");

  const todayStr = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      setBookingDate("");
      setDateError("");
      return;
    }
    const parts = val.split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const selectedDate = new Date(year, month, day);
    
    if (selectedDate.getDay() === 0) { // 0 is Sunday
      setDateError("Sundays are weekly offs for the studio. Please select Monday - Saturday.");
      setBookingDate("");
    } else {
      setDateError("");
      setBookingDate(val);
    }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dateError || !bookingDate) return;

    const text = `Hello Tiora Designer Studio, I would like to book a showroom design consultation.

Here are my details:
• Name: ${bookingName}
• Phone: ${bookingPhone}
• Date: ${bookingDate}
• Time Slot: ${bookingTime}
• Message: ${bookingMessage || "None"}`;

    const whatsappUrl = `https://wa.me/919063364078?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    
    setIsBookingModalOpen(false);
    setBookingName("");
    setBookingPhone("");
    setBookingDate("");
    setBookingTime("");
    setBookingMessage("");
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [resBanner, resOffers, resCatCards, resNav] = await Promise.all([
          fetch("/api/admin/settings?key=homepage_banner"),
          fetch("/api/admin/offers"),
          fetch("/api/admin/homepage-categories"),
          fetch("/api/admin/nav")
        ]);

        const [dataBanner, dataOffers, dataCatCards, dataNav] = await Promise.all([
          resBanner.json(),
          resOffers.json(),
          resCatCards.json(),
          resNav.json()
        ]);

        if (dataBanner.success && dataBanner.data) {
          setBannerUrl(dataBanner.data.value);
        }

        if (dataOffers.success) {
          setOffers(dataOffers.data);
        }

        if (dataCatCards.success) {
          setHomepageCatCards(dataCatCards.data);
        }

        if (dataNav.success) {
          const activeNavs = (dataNav.data || [])
            .filter((item: any) => item.isActive)
            .sort((a: any, b: any) => a.order - b.order);
          setNavCategories(activeNavs);
        }
      } catch (err) {
        console.warn("Failed to fetch settings/offers/categories", err);
      }
    }
    fetchData();
  }, []);

  // Duplicate nav categories to ensure marquee fills screen and loops seamlessly
  const repeatedNavCategories = useMemo(() => {
    if (navCategories.length === 0) return [];
    let list = [...navCategories];
    while (list.length < 10) {
      list = [...list, ...navCategories];
    }
    return list;
  }, [navCategories]);

  // Duplicate offers to ensure marquee fills screen and loops seamlessly
  const repeatedOffers = useMemo(() => {
    if (offers.length === 0) return [];
    let list = [...offers];
    while (list.length < 8) {
      list = [...list, ...offers];
    }
    return list;
  }, [offers]);

  interface Banner {
    url: string;
    link: string;
  }

  const banners = useMemo<Banner[]>(() => {
    if (!bannerUrl) return [];
    try {
      if (bannerUrl.trim().startsWith("[")) {
        return JSON.parse(bannerUrl);
      }
      return [{ url: bannerUrl, link: "" }];
    } catch {
      return [{ url: bannerUrl, link: "" }];
    }
  }, [bannerUrl]);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className="min-h-screen bg-brand-light text-brand font-sans selection:bg-brand-accent/30">
      {/* Dynamic Offer Announcement Bar */}
      {offers.length > 0 && (
        <div className="w-full bg-white h-10 flex items-center overflow-hidden relative z-30 border-b border-black/5">
          <div className="w-full flex items-center h-full relative">
            <div className="flex animate-marquee">
              {/* First Track */}
              <div className="flex items-center gap-12 px-6 flex-shrink-0">
                {repeatedOffers.map((offer, idx) => {
                  const { title, subtitle } = parseOfferText(offer.text);
                  const fullText = subtitle ? `${title} - ${subtitle}` : title;
                  const content = (
                    <span className="text-[#111111] text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap">
                      {fullText}
                    </span>
                  );
                  
                  return (
                    <div key={`track1-${offer.id}-${idx}`} className="flex items-center gap-12">
                      {offer.link ? (
                        <Link href={offer.link} className="hover:text-[#B18E35] transition-colors block">
                          {content}
                        </Link>
                      ) : (
                        <div>{content}</div>
                      )}
                      <span className="text-[#B18E35] text-[10px] select-none">★</span>
                    </div>
                  );
                })}
              </div>
              {/* Second Track (Duplicate for seamless loop) */}
              <div className="flex items-center gap-12 px-6 flex-shrink-0" aria-hidden="true">
                {repeatedOffers.map((offer, idx) => {
                  const { title, subtitle } = parseOfferText(offer.text);
                  const fullText = subtitle ? `${title} - ${subtitle}` : title;
                  const content = (
                    <span className="text-[#111111] text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap">
                      {fullText}
                    </span>
                  );
                  
                  return (
                    <div key={`track2-${offer.id}-${idx}`} className="flex items-center gap-12">
                      {offer.link ? (
                        <Link href={offer.link} className="hover:text-[#B18E35] transition-colors block">
                          {content}
                        </Link>
                      ) : (
                        <div>{content}</div>
                      )}
                      <span className="text-[#B18E35] text-[10px] select-none">★</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Dynamic Promo Banners Carousel */}
      {banners.length > 0 && (
        <div className="w-full relative overflow-hidden border-b border-black/5 group aspect-[21/9] mt-0">
          <div className="w-full h-full relative">
            <AnimatePresence mode="wait">
              {banners.map((banner, idx) => {
                const isLink = !!banner.link;
                const ImageElement = (
                  <motion.img 
                    key={banner.url}
                    src={banner.url} 
                    alt={`Current Offer Slide ${idx + 1}`} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.01]" 
                  />
                );

                return idx === currentSlide && (
                  <div key={idx} className="absolute inset-0 w-full h-full">
                    {isLink ? (
                      <Link href={banner.link} className="block w-full h-full cursor-pointer">
                        {ImageElement}
                      </Link>
                    ) : (
                      <div className="w-full h-full">{ImageElement}</div>
                    )}
                  </div>
                );
              })}
            </AnimatePresence>
            
            {/* Subtle overlay for depth */}
            <div className="absolute inset-0 bg-black/[0.02] pointer-events-none" />
            
            {/* Slide Navigation Controls */}
            {banners.length > 1 && (
              <>
                {/* Left/Right Arrow Buttons */}
                <button
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)}
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/25 active:scale-95 transition-all opacity-0 group-hover:opacity-100 z-40 cursor-pointer shadow-lg"
                  aria-label="Previous Slide"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % banners.length)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/25 active:scale-95 transition-all opacity-0 group-hover:opacity-100 z-40 cursor-pointer shadow-lg"
                  aria-label="Next Slide"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Dot Indicators */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-40">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === currentSlide ? "w-6 bg-white shadow-sm" : "w-2 bg-white/40 hover:bg-white/60"
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Navbar Categories Carousel */}
      {navCategories.length > 0 && (
        <div className="w-full py-10 overflow-hidden">
          <div className="w-full relative">
            <div className="flex animate-marquee hover:[animation-play-state:paused] pb-4 pt-2">
              {/* First Track */}
              <div className="flex gap-4 md:gap-6 px-3 md:px-4 flex-shrink-0">
                {repeatedNavCategories.map((cat, idx) => (
                  <Link key={`nav1-${idx}`} href={cat.href || "#"} className="flex flex-col items-center gap-4 min-w-[160px] md:min-w-[200px] group cursor-pointer">
                    <div className="w-40 h-40 md:w-48 md:h-48 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-all bg-white flex-shrink-0 relative border border-black/5 group-hover:border-[#385042]">
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt={cat.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={e => (e.currentTarget.src = "/images/placeholder.png")} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                          <span className="text-xs uppercase font-medium text-center px-2">{cat.label}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[#385042] font-bold text-sm md:text-base text-center tracking-wide">{cat.label}</span>
                  </Link>
                ))}
              </div>
              {/* Second Track */}
              <div className="flex gap-4 md:gap-6 px-3 md:px-4 flex-shrink-0" aria-hidden="true">
                {repeatedNavCategories.map((cat, idx) => (
                  <Link key={`nav2-${idx}`} href={cat.href || "#"} className="flex flex-col items-center gap-4 min-w-[160px] md:min-w-[200px] group cursor-pointer">
                    <div className="w-40 h-40 md:w-48 md:h-48 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-all bg-white flex-shrink-0 relative border border-black/5 group-hover:border-[#385042]">
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt={cat.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={e => (e.currentTarget.src = "/images/placeholder.png")} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                          <span className="text-xs uppercase font-medium text-center px-2">{cat.label}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[#385042] font-bold text-sm md:text-base text-center tracking-wide">{cat.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Featured Products Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">


        {/* Dynamic Categories Grid */}
        {homepageCatCards.length > 0 && (
          <section className="w-full mx-auto mb-16 mt-12">
            <div className="flex flex-col items-center justify-center mb-12 text-center">
              <h2 className="text-4xl md:text-5xl font-playfair font-light tracking-widest text-[#111111] uppercase mb-4">Categories</h2>
              <p className="text-[#B18E35] text-xs md:text-sm font-medium tracking-[0.15em] uppercase">
                Crafted for elegance. Tailored for you.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {homepageCatCards.map((item) => {
                const displayName = item.name
                  .split(/\s+/)
                  .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                  .join(" ");

                const CardContent = (
                  <div className="group flex flex-col items-center w-full cursor-pointer">
                    <div className="w-full aspect-[2/3] overflow-hidden relative shadow-none">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        onError={e => (e.currentTarget.src = "/images/placeholder.png")}
                      />
                    </div>
                    <span className="mt-4 text-[10px] md:text-xs font-semibold uppercase tracking-[0.2em] text-[#111111] group-hover:text-[#B18E35] transition-colors text-center">
                      {displayName}
                    </span>
                  </div>
                );

                const targetLink = item.link || `/category/${item.name.toLowerCase().trim().replace(/\s+/g, "-")}`;

                return (
                  <Link key={item.id} href={targetLink} className="block">
                    {CardContent}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <ProductGrid />
      </main>

      {/* Schedule an Appointment Showroom Banner */}
      <section className="w-full relative h-[280px] md:h-[400px] flex flex-col items-center justify-center text-center overflow-hidden border-t border-black/5">
        {/* Background Image */}
        <img
          src="/images/tiora_showroom_banner.png"
          alt="Tiora Showroom Atelier"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Dark contrast overlay */}
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[0.5px]" />

        {/* Content */}
        <div className="relative z-10 space-y-4 px-6 text-white select-none">
          <h2 className="text-xl md:text-3xl font-playfair font-bold uppercase tracking-[0.25em] text-white">
            Schedule An Appointment
          </h2>
          <p className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-white/90 max-w-xl mx-auto leading-relaxed">
            Click below to schedule a virtual or an in-store appointment at our Hyderabad flagship studio.
          </p>
          <div className="pt-4">
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="inline-block bg-white text-[#111111] py-3.5 px-8 text-xs font-black uppercase tracking-widest transition-all hover:bg-neutral-100 hover:scale-105 active:scale-95 shadow-md rounded-none cursor-pointer"
            >
              Book Now
            </button>
          </div>
        </div>
      </section>

      {/* Appointment Booking Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setIsBookingModalOpen(false)}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-md bg-[#faf8f0] border border-black/10 p-6 md:p-8 animate-in zoom-in-95 duration-200 shadow-2xl z-10">
            {/* Top gold decorative line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#B18E35]" />

            {/* Close Button */}
            <button
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-[#111111] transition-colors cursor-pointer"
              aria-label="Close booking modal"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="text-center space-y-2 mb-6">
              <h3 className="font-playfair text-xl font-bold uppercase tracking-widest text-[#111111]">
                Schedule Showroom Visit
              </h3>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                Request a design consultation at Tiora Hyderabad
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 block">Name *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-400">
                    <User size={14} />
                  </span>
                  <input
                    type="text"
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    required
                    placeholder="Enter your name"
                    className="w-full bg-white border border-black/10 rounded-none pl-10 pr-4 py-3 text-xs font-bold focus:outline-none focus:border-[#B18E35] transition-all text-[#111111]"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 block">Phone Number *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-400">
                    <Phone size={14} />
                  </span>
                  <input
                    type="tel"
                    value={bookingPhone}
                    onChange={(e) => setBookingPhone(e.target.value)}
                    required
                    placeholder="Enter phone number"
                    className="w-full bg-white border border-black/10 rounded-none pl-10 pr-4 py-3 text-xs font-bold focus:outline-none focus:border-[#B18E35] transition-all text-[#111111]"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 block">Appointment Date *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-400">
                    <Calendar size={14} />
                  </span>
                  <input
                    type="date"
                    min={todayStr}
                    value={bookingDate}
                    onChange={handleDateChange}
                    required
                    className="w-full bg-white border border-black/10 rounded-none pl-10 pr-4 py-3 text-xs font-bold focus:outline-none focus:border-[#B18E35] transition-all text-[#111111]"
                  />
                </div>
                {dateError && (
                  <p className="text-red-500 text-[10px] font-semibold mt-1">{dateError}</p>
                )}
              </div>

              {/* Time Slots */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 block">Time Slot *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-400">
                    <Clock size={14} />
                  </span>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    required
                    className={`w-full bg-white border border-black/10 rounded-none pl-10 pr-10 py-3 text-xs font-bold focus:outline-none focus:border-[#B18E35] transition-all appearance-none cursor-pointer ${!bookingTime ? 'text-neutral-400' : 'text-[#111111]'}`}
                  >
                    <option value="" disabled hidden>Select Timings</option>
                    <option value="12:00 PM - 01:00 PM">12:00 PM - 01:00 PM</option>
                    <option value="01:00 PM - 02:00 PM">01:00 PM - 02:00 PM</option>
                    <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                    <option value="03:00 PM - 04:00 PM">03:00 PM - 04:00 PM</option>
                    <option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
                    <option value="05:00 PM - 06:00 PM">05:00 PM - 06:00 PM</option>
                    <option value="06:00 PM - 07:00 PM">06:00 PM - 07:00 PM</option>
                    <option value="07:00 PM - 08:00 PM">07:00 PM - 08:00 PM</option>
                  </select>
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-neutral-400">
                    <ChevronDown size={14} />
                  </span>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 block">Message to Studio (Optional)</label>
                <div className="relative">
                  <span className="absolute top-3 left-3.5 text-neutral-400">
                    <MessageSquare size={14} />
                  </span>
                  <textarea
                    value={bookingMessage}
                    onChange={(e) => setBookingMessage(e.target.value)}
                    placeholder="Describe any style preferences, outfit types, or customizations"
                    rows={3}
                    className="w-full bg-white border border-black/10 rounded-none pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#B18E35] transition-all text-[#111111]"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-[#0E2C2C] hover:bg-[#0A2222] text-[#C5A059] py-3.5 text-center text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer rounded-none mt-2"
              >
                <span>Confirm & Request via WhatsApp</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

