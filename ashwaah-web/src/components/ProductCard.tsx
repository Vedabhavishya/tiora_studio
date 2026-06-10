"use client";

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '@/store/useWishlistStore';
import { usePathname } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  description: string;
  price?: number;
  basePrice?: number;
  salePrice?: number;
  imageUrl: string;
  categorySlug: string;
  isCustomizable?: boolean;
}

export default function ProductCard({ product }: { product: Product }) {
  const basePrice = product.basePrice ?? product.price ?? 0;
  const salePrice = product.salePrice ?? product.price ?? 0;
  
  // Active price to display
  const activePrice = salePrice > 0 && salePrice < basePrice ? salePrice : basePrice;
  const originalPrice = basePrice;
  
  // Calculate discount percentage automatically
  const discount = originalPrice > 0 && activePrice < originalPrice
    ? Math.round(((originalPrice - activePrice) / originalPrice) * 100)
    : 0;

  const pathname = usePathname();
  const isWishlisted = useWishlistStore((state) => state.items.some((item) => item.productId === Number(product.id)));
  const addItem = useWishlistStore((state) => state.addItem);
  const removeItem = useWishlistStore((state) => state.removeItem);
  const isAuthenticated = useWishlistStore((state) => state.isAuthenticated);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(pathname)}`;
      return;
    }

    if (isWishlisted) {
      await removeItem(Number(product.id));
    } else {
      await addItem(Number(product.id));
    }
  };

  return (
    <Link 
      href={`/product/${product.id}`} 
      className="group flex flex-col w-full bg-[#FFFDF6] rounded-3xl border border-brand/5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 overflow-hidden"
    >
      {/* Top Image Section */}
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-brand-light/50 border-b border-brand/5">
        {product.isCustomizable && (
          <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-brand/10 shadow-sm">
            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-brand">Customizable</span>
          </div>
        )}
        <img 
          src={product.imageUrl || "/images/placeholder.png"} 
          alt={product.name} 
          className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
        />
      </div>
      
      {/* Bottom Content Section */}
      <div className="pt-3 pb-3 px-3 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-2 mb-0.5 w-full">
          <h3 className="text-xs md:text-sm font-black tracking-widest text-[#1B3022] uppercase line-clamp-1 flex-grow">
            {product.name}
          </h3>
          <button
            type="button"
            onClick={handleWishlistClick}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-full hover:bg-black/5 transition-all duration-300 flex-shrink-0 cursor-pointer"
            aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <Heart size={14} className={isWishlisted ? "fill-red-500 text-red-500" : "text-[#1B3022]/60"} />
          </button>
        </div>
        <p className="text-[10px] md:text-xs text-[#1B3022]/60 font-inter line-clamp-1 mb-1.5">
          {product.description || "Designer piece"}
        </p>
        
        <div className="flex items-center gap-2 mt-auto">
          <span className="text-xs md:text-sm font-black text-[#1B3022]">
            ₹{activePrice.toLocaleString()}
          </span>
          {discount > 0 && (
            <>
              <span className="text-[10px] md:text-xs text-[#1B3022]/40 line-through">
                ₹{originalPrice.toLocaleString()}
              </span>
              <span className="text-[10px] md:text-xs font-bold text-[#cd5533]">
                ({discount}% OFF)
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
