"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
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
        <div className="w-full bg-[#FFFDF6] text-[#5C1D16] h-12 flex items-center justify-center overflow-hidden border-b border-[#5C1D16]/10 relative z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 w-full text-center flex items-center justify-center h-full relative">
            <AnimatePresence mode="wait">
              {offers.map((offer, idx) => (
                idx === currentOfferIndex && (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, x: "-100%" }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: "100%" }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="absolute inset-0 flex items-center justify-center px-4"
                  >
                    {offer.link ? (
                      <Link href={offer.link} className="hover:text-white transition-colors duration-300 flex items-center gap-2">
                        <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em]">📢 {offer.text}</span>
                        <span className="text-[8px] md:text-[9px] font-black bg-[#C5A059] text-white px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm">Shop Now →</span>
                      </Link>
                    ) : (
                      <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em]">📢 {offer.text}</span>
                    )}
                  </motion.div>
                )
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <header className="relative w-full min-h-[45vh] flex flex-col items-center justify-center overflow-hidden border-b border-brand/10 bg-brand-light pt-10 pb-12">

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-20 text-center px-4 max-w-5xl mx-auto"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center space-x-2 bg-brand/5 border border-brand/10 text-brand text-xs font-bold px-4 py-1.5 rounded-full mb-6 shadow-sm tracking-widest uppercase"
          >
            <Sparkles size={14} className="text-brand-accent" />
            <span>Curated for All. Customized for You</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-4xl md:text-6xl font-playfair font-bold tracking-tight mb-6 text-brand leading-[1.15]"
          >
            Standard Sizes. <br /> <span className="text-brand-accent italic">Perfected Fits.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-brand/70 text-base md:text-lg max-w-2xl mx-auto mb-4 font-inter leading-relaxed"
          >
            At Ashwaah, Our crafted designs meet your individuality — pre‑made or personalised, always perfect for you
          </motion.p>
        </motion.div>
        
        {/* Subtle background element */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-brand/5 to-transparent"></div>
      </header>

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
                  <div className="w-32 h-32 md:w-48 md:h-48 rounded-xl overflow-hidden border-2 border-[#5C1D16]/30 shadow-lg transition-transform duration-500 group-hover:scale-105 group-hover:border-[#5C1D16] group-hover:shadow-[#5C1D16]/20 relative">
                    <img 
                      src={item.imageUrl || "/images/placeholder.png"} 
                      alt={item.label} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      onError={e => (e.currentTarget.src = "/images/placeholder.png")}
                    />
                  </div>
                  <span className="mt-4 text-xs md:text-sm font-bold tracking-wide text-brand/80 group-hover:text-[#5C1D16] transition-colors text-center w-full max-w-[12rem] break-words block">
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
                    <div className="relative z-10 w-full p-3 bg-[#cd5533]/90 backdrop-blur-sm text-white rounded-t-2xl text-center transition-all duration-300 group-hover:bg-[#cd5533] flex flex-col items-center justify-center">
                      <span className="text-[9px] md:text-[10px] tracking-wider uppercase font-medium text-center w-full block break-words">
                        {item.name}
                      </span>
                      <span className="text-xs md:text-sm font-bold font-playfair tracking-tight leading-tight my-0.5 uppercase text-center w-full block break-words">
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

