"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";

type NavItem = {
  id: number;
  label: string;
  href: string;
  imageUrl?: string;
  order: number;
  isActive: boolean;
};

import { motion, AnimatePresence } from "framer-motion";

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
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  const [bannerUrl, setBannerUrl] = useState("");
  const [offers, setOffers] = useState<any[]>([]);
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  const [homepageCatCards, setHomepageCatCards] = useState<any[]>([]);

  const [isHovered, setIsHovered] = useState(false);
  const scrollPosRef = useRef(0);

  useEffect(() => {
    if (isLoading || navItems.length === 0 || !carouselRef.current) return;

    let animationFrameId: number;
    const scrollContainer = carouselRef.current;
    const scrollSpeed = 0.6; // Very slow speed (pixels per frame)

    const updateScroll = () => {
      if (!isHovered) {
        scrollPosRef.current += scrollSpeed;
        const maxScroll = scrollContainer.scrollWidth / 2;

        if (scrollPosRef.current >= maxScroll) {
          scrollPosRef.current = 0;
        }
        scrollContainer.scrollLeft = scrollPosRef.current;
      }
      animationFrameId = requestAnimationFrame(updateScroll);
    };

    const handleScroll = () => {
      if (Math.abs(scrollContainer.scrollLeft - scrollPosRef.current) > 2) {
        scrollPosRef.current = scrollContainer.scrollLeft;
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    animationFrameId = requestAnimationFrame(updateScroll);

    return () => {
      cancelAnimationFrame(animationFrameId);
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [isLoading, navItems, isHovered]);



  useEffect(() => {
    const fetchNavItems = async () => {
      try {
        const res = await fetch("/api/admin/nav");
        const data = await res.json();
        if (data.success) {
          setNavItems(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch nav items:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNavItems();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const resBanner = await fetch("/api/admin/settings?key=homepage_banner");
        const dataBanner = await resBanner.json();
        if (dataBanner.success && dataBanner.data) {
          setBannerUrl(dataBanner.data.value);
        }

        const resOffers = await fetch("/api/admin/offers");
        const dataOffers = await resOffers.json();
        if (dataOffers.success) {
          setOffers(dataOffers.data);
        }

        const resCatCards = await fetch("/api/admin/homepage-categories");
        const dataCatCards = await resCatCards.json();
        if (dataCatCards.success) {
          setHomepageCatCards(dataCatCards.data);
        }
      } catch (err) {
        console.error("Failed to fetch settings/offers/categories", err);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (offers.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentOfferIndex((prev) => (prev + 1) % offers.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [offers.length]);
  return (
    <div className="min-h-screen bg-brand-light text-brand font-sans selection:bg-brand-accent/30">
      {/* Dynamic Offer Announcement Bar (Carousel, 1cm - 2cm Height) */}
      {offers.length > 0 && (
        <div className="w-full bg-[#F5EBE0] text-[#064e3b] h-24 flex items-center justify-center overflow-hidden border-b border-[#064e3b]/10 relative z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 w-full text-center flex items-center justify-center h-full relative">
            <AnimatePresence mode="wait">
              {offers.map((offer, idx) => {
                const { title, subtitle } = parseOfferText(offer.text);
                 const TicketContent = (
                  <div className={`relative flex items-center h-16 bg-[#064e3b] text-white px-10 rounded-l-2xl rounded-r-md shadow-md overflow-hidden font-inter ${!subtitle ? "justify-center" : ""}`}>
                    {/* Left Title */}
                    <span className={`font-extrabold text-lg md:text-xl uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap ${subtitle ? "pr-4" : ""}`}>
                      {title}
                    </span>
                    
                    {subtitle && (
                      <>
                        {/* Dashed Divider with top/bottom circular cutouts */}
                        <div className="relative h-full flex items-center px-1">
                          <div className="absolute -top-[10px] left-1/2 -translate-x-1/2 w-5 h-5 bg-[#F5EBE0] rounded-full"></div>
                          <div className="h-3/5 border-l border-dashed border-white/50"></div>
                          <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-5 h-5 bg-[#F5EBE0] rounded-full"></div>
                        </div>
                        
                        {/* Right Subtitle */}
                        <span className="text-sm md:text-base font-black uppercase tracking-widest pl-4 pr-2 opacity-95 whitespace-nowrap">
                          {subtitle}
                        </span>
                      </>
                    )}

                    {/* Jagged right edge (torn coupon effect) */}
                    <div className="absolute right-0 top-0 bottom-0 w-1 flex flex-col justify-between py-1">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="w-1 h-1.5 bg-[#F5EBE0] rounded-l-full"></div>
                      ))}
                    </div>
                  </div>
                );

                return idx === currentOfferIndex && (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, x: "-100%" }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: "100%" }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="absolute inset-0 flex items-center justify-center px-4"
                  >
                    {offer.link ? (
                      <Link href={offer.link} className="hover:scale-[1.02] transition-transform duration-300 shadow-sm hover:shadow-md block">
                        {TicketContent}
                      </Link>
                    ) : (
                      <div className="shadow-sm">
                        {TicketContent}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}



      {/* Dynamic Promo Banner Image */}
      {bannerUrl && (
        <div className="w-full relative overflow-hidden border-b border-brand/10 group mt-0">
          <img 
            src={bannerUrl} 
            alt="Current Offers & Collections" 
            className="w-full h-auto transition-transform duration-1000 ease-out group-hover:scale-[1.01]" 
          />
          {/* Subtle overlay for depth */}
          <div className="absolute inset-0 bg-black/[0.02] pointer-events-none"></div>
        </div>
      )}

      {/* Featured Collections Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Dynamic Category Row */}
        <section className="w-full mx-auto mt-12 mb-4 relative group">


          <div 
            ref={carouselRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => setIsHovered(false)}
            className="flex gap-6 overflow-x-auto pb-6 pt-4 px-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {isLoading ? (
               Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center shrink-0 animate-pulse">
                  <div className="w-32 h-32 md:w-48 md:h-48 rounded-xl bg-brand/5 mb-4"></div>
                  <div className="h-4 w-20 bg-brand/5 rounded-full"></div>
                </div>
              ))
            ) : (
              [...navItems, ...navItems].map((item, index) => (
                <Link 
                  key={`${item.id}-${index}`} 
                  href={item.href} 
                  className="group flex flex-col items-center shrink-0"
                >
                  <div className="w-32 h-32 md:w-48 md:h-48 rounded-xl overflow-hidden border-2 border-[#064e3b]/30 shadow-lg transition-transform duration-500 group-hover:scale-105 group-hover:border-[#064e3b] group-hover:shadow-[#064e3b]/20 relative">
                    <img 
                      src={item.imageUrl || "/images/placeholder.png"} 
                      alt={item.label} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      onError={e => (e.currentTarget.src = "/images/placeholder.png")}
                    />
                  </div>
                  <span className="mt-4 text-xs md:text-sm font-bold tracking-wide text-brand/80 group-hover:text-[#064e3b] transition-colors text-center w-full max-w-[12rem] break-words block">
                    {item.label}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Dynamic Category Promo Grid Cards (Grid of aspect-3/4 blocks) */}
        {homepageCatCards.length > 0 && (
          <section className="w-full mx-auto mb-4">
            {/* Categories Heading */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center text-center mb-12 border-b border-brand/10 pb-6"
            >
              <div>
                <h2 className="text-4xl font-playfair font-bold mb-3 text-brand">Categories</h2>
                <p className="text-brand/60 italic">Pre-made or personalized, always perfect for you.</p>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {homepageCatCards.map((item) => {
                const CardContent = (
                  <div className="group relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-lg border border-brand/5 flex flex-col justify-end transition-all duration-500 hover:scale-[1.03] hover:shadow-xl">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      onError={e => (e.currentTarget.src = "/images/placeholder.png")}
                    />
                    {/* Shadow overlay for depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none"></div>
                    
                    {/* Overlaid coral-orange card at bottom */}
                    <div className="relative z-10 w-full p-3 bg-[#064e3b]/90 backdrop-blur-sm text-white rounded-t-2xl text-center transition-all duration-300 group-hover:bg-[#064e3b] flex flex-col items-center justify-center">
                      <span className="text-[9px] md:text-[10px] tracking-wider uppercase font-medium text-center w-full block break-words">
                        {item.name}
                      </span>
                      <span className="text-base md:text-lg font-bold tracking-tight leading-tight my-0.5 uppercase text-center w-full block break-words">
                        {item.promoText}
                      </span>
                      <span className="text-[8px] font-bold tracking-widest uppercase border-t border-white/20 pt-1 mt-1 w-full block transition-colors group-hover:text-white">
                        {item.actionText || "Shop Now"}
                      </span>
                    </div>
                  </div>
                );

                // If link is empty, construct a dynamic fallback path like /category/ethnic-wear
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


    </div>
  );
}

