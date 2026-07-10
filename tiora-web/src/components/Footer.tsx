"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Facebook = ({ size = 20, strokeWidth = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const Instagram = ({ size = 20, strokeWidth = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

interface NavItem {
  id: number;
  label: string;
  href: string;
  order: number;
  isActive: boolean;
}

export default function Footer() {
  const pathname = usePathname();
  const [shopLinks, setShopLinks] = useState<NavItem[]>([]);

  useEffect(() => {
    async function fetchShopLinks() {
      try {
        const res = await fetch("/api/admin/nav");
        const data = await res.json();
        if (data.success) {
          // Filter only active items and sort them by order
          const activeLinks = (data.data as NavItem[])
            .filter(item => item.isActive)
            .sort((a, b) => a.order - b.order);
          setShopLinks(activeLinks);
        }
      } catch (err) {
        console.warn("Failed to fetch footer shop links", err);
      }
    }
    fetchShopLinks();
  }, [pathname]);

  // Hide Footer for Admin Portal
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="w-full bg-white pt-16 pb-4 px-6 md:px-12 border-t border-black/5 text-brand-dark">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
        {/* Column 1: Brand Info */}
        <div className="md:col-span-5 space-y-4">
          <Link href="/" className="flex items-center gap-1.5 group">
            <img 
              src="/images/tiora_logo.jpeg" 
              alt="Tiora Logo" 
              className="h-10 w-10 rounded-full object-cover transition-transform duration-300 group-hover:scale-105" 
            />
            <span className="font-playfair text-lg font-semibold uppercase tracking-[0.2em] text-brand-dark group-hover:text-brand-accent transition-colors">
              Tiora
            </span>
          </Link>
          <p className="text-brand-dark/70 text-xs leading-relaxed max-w-sm">
            At Tiora, our crafted designs meet your individuality. 
            We specialize in premium custom-fit apparel tailored to your exact measurements for a perfect, personalized fit.
          </p>
        </div>

        {/* Column 2: Shop Links */}
        <div className="md:col-span-2">
          <h4 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-accent mb-4">Shop</h4>
          <ul className="space-y-2.5 text-xs text-brand-dark/80 font-medium">
            {shopLinks.length > 0 ? (
              shopLinks.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="hover:text-brand-accent transition">
                    {item.label}
                  </Link>
                </li>
              ))
            ) : (
              <>
                <li><Link href="/category/mens" className="hover:text-brand-accent transition">Menswear</Link></li>
                <li><Link href="/category/womens" className="hover:text-brand-accent transition">Womenswear</Link></li>
                <li><Link href="/category/home-accessories" className="hover:text-brand-accent transition">Home Accessories</Link></li>
              </>
            )}
          </ul>
        </div>

        {/* Column 3: Customer Care & Policies */}
        <div className="md:col-span-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-accent mb-4">Customer Care</h4>
          <ul className="space-y-2.5 text-xs text-brand-dark/80 font-medium">
            <li><Link href="/my-story#contact" className="hover:text-brand-accent transition">Contact Us</Link></li>
            <li><Link href="/shipping-delivery" className="hover:text-brand-accent transition">Shipping & Delivery</Link></li>
            <li><Link href="/cancellation-returns" className="hover:text-brand-accent transition">Cancellation & Returns</Link></li>
            <li><Link href="/privacy-policy" className="hover:text-brand-accent transition">Privacy Policy & Terms</Link></li>
          </ul>
        </div>

        {/* Column 4: Socials */}
        <div className="md:col-span-2">
          <h4 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-accent mb-4">Keep In Touch</h4>
          <div className="flex space-x-4 text-brand-dark/60 mb-6">
            <a 
              href="https://www.facebook.com/share/1Ddd2P38UR/?mibextid=wwXIfr" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-brand-accent transition" 
              aria-label="Facebook"
            >
              <Facebook size={18} />
            </a>
            <a 
              href="https://www.instagram.com/tioradesignerstudio?igsh=dGttdXI3OGx6NWZq&utm_source=qr" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-brand-accent transition" 
              aria-label="Instagram"
            >
              <Instagram size={18} />
            </a>
          </div>
          <p className="text-[9px] text-brand-dark/50 font-bold uppercase tracking-[0.2em] mb-2">Email Support</p>
          <a href="mailto:Tioradesignerstudio@gmail.com" className="text-xs font-medium text-brand-dark hover:text-brand-accent transition">
            Tioradesignerstudio@gmail.com
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-black/5 flex items-center justify-center">
        <p className="text-[10px] text-brand-dark/50 font-medium tracking-wider uppercase text-center">
          &copy; {new Date().getFullYear()} Tiora. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
