"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingCart, User, Menu, X, LogOut, AlertCircle, BookOpen, Heart, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProfileDropdown from "./ProfileDropdown";
import SearchModal from "./SearchModal";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";

type NavItem = {
  id: number;
  label: string;
  href: string;
  order: number;
  isActive: boolean;
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  

  const [navItems, setNavItems] = useState<NavItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ fullName: string | null; phoneNumber: string } | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Cart store hydration handling
  const [cartCount, setCartCount] = useState(0);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  // Wishlist store hooks
  const wishlistItems = useWishlistStore((state) => state.items);
  const fetchWishlist = useWishlistStore((state) => state.fetchWishlist);
  const removeItem = useWishlistStore((state) => state.removeItem);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  useEffect(() => {
    setCartCount(getTotalItems());
    
    // Sync cart with backend if user is logged in
    const syncCart = async () => {
      if (user && cartItems.length > 0) {
        try {
          await fetch("/api/cart/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: cartItems }),
          });
        } catch (error) {
          console.error("Failed to sync cart", error);
        }
      }
    };

    const timeoutId = setTimeout(syncCart, 1000); // Debounce sync
    return () => clearTimeout(timeoutId);
  }, [cartItems, getTotalItems, user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Nav Items
        const navRes = await fetch("/api/admin/nav");
        const navData = await navRes.json();
        if (navData.success) {
          setNavItems(navData.data);
        }

        // Fetch Session
        const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
        const sessionData = await sessionRes.json();
        if (sessionData.authenticated) {
          setUser(sessionData.user);
          // Fetch wishlist
          fetchWishlist();
        } else {
          setUser(null);
          // If the user is logged out, ensure the cart and wishlist are empty
          if (cartItems.length > 0) {
            clearCart();
          }
          clearWishlist();
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }

    };

    fetchData();
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setUser(null);
        clearCart();
        clearWishlist();
        setIsLogoutModalOpen(false);
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Hide Navbar for Admin Portal
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#064e3b] border-b border-white/10 shadow-lg font-inter">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center mr-8">
              <Link href="/" className="flex items-center gap-1.5 group">
                <img 
                  src="/images/logo.png" 
                  alt="Ashwaah Logo" 
                  className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
                />
                <span className="font-playfair text-xl md:text-2xl font-medium text-white tracking-wide hover:text-[#C5A059] transition-colors">
                  Ashwaah
                </span>
              </Link>
            </div>

            {/* Desktop Navigation (Dynamic from DB - moved to home page) */}
            <nav className="hidden lg:flex items-center space-x-6 mr-4">
            </nav>

            <div className="hidden md:flex items-center space-x-4 ml-auto text-white">
              {/* Unified Minimalist Search Bar */}
              <div className="max-w-[280px] md:w-[280px]">
                <form onSubmit={handleSearchSubmit} className="w-full relative flex items-center">
                  <div className="absolute left-3 flex items-center pointer-events-none text-brand-dark/40">
                    <Search size={16} strokeWidth={2.2} />
                  </div>
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products"
                    className="w-full bg-[#FFFDF6] text-brand-dark pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A059] placeholder:text-brand-dark/45 transition-all shadow-sm"
                  />
                </form>
              </div>

              <Link href="/my-story" aria-label="My Story" className="hover:text-[#C5A059] transition-colors p-2 flex items-center gap-1.5 group">
                <BookOpen className="h-5 w-5" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">My Story</span>
              </Link>

              <Link
                href={user ? "/wishlist" : `/login?redirect=${encodeURIComponent(pathname)}`}
                aria-label="Wishlist"
                className="hover:text-[#C5A059] transition-colors relative p-2 cursor-pointer"
              >
                <Heart className="h-5 w-5 text-white" />
                {user && wishlistItems.length > 0 && (
                  <span className="absolute top-0 right-0 bg-[#FFFDF6] text-[#064e3b] text-[8px] font-black h-3.5 w-3.5 rounded-full flex items-center justify-center border-2 border-[#064e3b]">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              <Link href={user ? "/cart" : "/login"} aria-label="Cart" className="hover:text-[#C5A059] transition-colors relative p-2">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute top-0 right-0 bg-[#FFFDF6] text-[#064e3b] text-[8px] font-black h-3.5 w-3.5 rounded-full flex items-center justify-center border-2 border-[#064e3b]">
                  {cartCount}
                </span>
              </Link>
              
              {user ? (
                <ProfileDropdown 
                  user={user} 
                  onLogout={() => setIsLogoutModalOpen(true)} 
                />
              ) : (
                <button 
                  onClick={() => window.location.href = "/login"}
                  className="flex items-center space-x-2 text-xs font-bold tracking-[0.2em] uppercase bg-[#C5A059] text-white px-6 py-2.5 rounded-full hover:bg-[#B38E46] transition-all shadow-md cursor-pointer relative z-10"
                >
                  <User className="h-4 w-4" />
                  <span>Login</span>
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center space-x-4">
              <button onClick={() => setIsSearchOpen(true)} aria-label="Search" className="text-white p-2">
                <Search className="h-5 w-5" />
              </button>
              <Link href="/my-story" aria-label="My Story" className="text-white p-2">
                <BookOpen className="h-5 w-5" />
              </Link>
              <Link
                href={user ? "/wishlist" : `/login?redirect=${encodeURIComponent(pathname)}`}
                aria-label="Wishlist"
                className="text-white relative p-2 cursor-pointer"
              >
                <Heart className="h-5 w-5 text-white" />
                {user && wishlistItems.length > 0 && (
                  <span className="absolute top-0 right-0 bg-[#FFFDF6] text-[#064e3b] text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-[#064e3b]">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              <Link href={user ? "/cart" : "/login"} aria-label="Cart" className="text-white relative p-2">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute top-0 right-0 bg-[#FFFDF6] text-[#064e3b] text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-[#064e3b]">
                  {cartCount}
                </span>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white hover:text-[#C5A059] focus:outline-none p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#064e3b] border-t border-white/10 animate-in slide-in-from-top duration-300">
            <div className="px-6 pt-8 pb-12 space-y-4">
              {/* Dynamic categories moved to home page */}
              
              <div className="pt-8 border-t border-white/10">
                {user ? (
                  <div className="space-y-4">
                    <Link
                      href="/profile"
                      className="flex items-center space-x-4 px-4 py-4 rounded-xl bg-white/5"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#FFFDF6] flex items-center justify-center text-[#064e3b] font-bold">
                        {user.fullName?.charAt(0) || "U"}
                      </div>
                      <div>
                        <div className="text-sm font-bold uppercase tracking-widest text-white">{user.fullName || "My Profile"}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest">View Details</div>
                      </div>
                    </Link>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsLogoutModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center space-x-3 px-4 py-4 rounded-xl border-2 border-red-500/20 text-red-400 font-bold uppercase tracking-widest text-xs"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      window.location.href = "/login";
                    }}
                    className="block w-full px-4 py-5 rounded-xl text-center text-sm font-bold uppercase tracking-[0.2em] text-white bg-[#C5A059] hover:bg-[#B38E46] shadow-lg relative z-10"
                  >
                    Login / Sign Up
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertCircle className="text-red-500 h-6 w-6" />
              </div>
              <h3 className="text-xl font-playfair font-bold text-brand mb-2">Log out</h3>
              <p className="text-brand/60 text-sm mb-8 leading-relaxed">
                Are you sure you want to log out from Ashwaah? You'll need to verify your phone number to sign in again.
              </p>
              
              <div className="w-full space-y-3">
                <button
                  onClick={confirmLogout}
                  disabled={isLoggingOut}
                  className="w-full px-4 py-3.5 rounded-xl bg-white border-2 border-red-50 text-red-500 font-bold text-sm tracking-widest uppercase hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoggingOut ? (
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Yes, Logout"
                  )}
                </button>
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  disabled={isLoggingOut}
                  className="w-full px-4 py-3.5 rounded-xl bg-brand text-white font-bold text-sm tracking-widest uppercase hover:bg-brand-hover transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Wishlist Sidebar Drawer Overlay */}
      <AnimatePresence>
        {isWishlistOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWishlistOpen(false)}
              className="absolute inset-0 bg-black cursor-pointer"
            />

            {/* Drawer Body */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="relative w-full max-w-md bg-[#FFFDF6] h-full shadow-2xl flex flex-col z-10"
            >
              {/* Header */}
              <div className="p-6 border-b border-brand/5 flex items-center justify-between bg-brand/5">
                <div className="flex items-center space-x-2 text-brand">
                  <Heart className="h-5 w-5 fill-[#064e3b] text-[#064e3b]" />
                  <span className="font-playfair text-lg font-bold">My Wishlist ({wishlistItems.length})</span>
                </div>
                <button
                  onClick={() => setIsWishlistOpen(false)}
                  className="p-2 hover:bg-brand/10 rounded-full transition-all text-brand cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {wishlistItems.length === 0 ? (
                  <div className="text-center py-20 text-brand/35">
                    <Heart className="mx-auto mb-4 opacity-20 text-brand animate-pulse" size={48} />
                    <p className="text-xs font-black uppercase tracking-[0.25em] mb-4">Your wishlist is empty</p>
                    <button
                      onClick={() => {
                        setIsWishlistOpen(false);
                        router.push("/");
                      }}
                      className="mt-6 text-xs font-black uppercase tracking-widest bg-[#064e3b] text-white px-6 py-3 rounded-xl hover:bg-brand-hover transition shadow-md cursor-pointer"
                    >
                      Explore Collections
                    </button>
                  </div>
                ) : (
                  wishlistItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between p-3 bg-brand/5 border border-brand/5 rounded-2xl group transition-all hover:bg-brand/10"
                    >
                      {/* Thumbnail and Info */}
                      <Link
                        href={`/product/${item.productId}`}
                        onClick={() => setIsWishlistOpen(false)}
                        className="flex items-center space-x-4 flex-1 min-w-0 pr-4"
                      >
                        <div className="w-16 h-20 bg-brand-light/30 rounded-xl overflow-hidden flex-shrink-0 border border-brand/5">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-brand uppercase tracking-wider truncate mb-0.5">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-[#064e3b] font-bold uppercase tracking-widest mb-1">
                            {item.category}
                          </p>
                          <p className="text-xs font-bold text-[#064e3b]">
                            ₹{item.price.toLocaleString()}
                          </p>
                        </div>
                      </Link>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/product/${item.productId}`}
                          onClick={() => setIsWishlistOpen(false)}
                          className="px-3 py-2 bg-[#C5A059] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#B38E46] transition shadow-sm"
                        >
                          Shop
                        </Link>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all cursor-pointer"
                          aria-label="Remove"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}



