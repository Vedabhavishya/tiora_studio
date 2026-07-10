"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, User, Menu, X, LogOut, AlertCircle, BookOpen, Heart, Trash2, Sparkles } from "lucide-react";
import ShoppingBagIcon from "@/components/icons/ShoppingBagIcon";
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
        console.warn("Failed to fetch data:", error);
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
      <header className="sticky top-0 z-50 w-full bg-white border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center mr-2 sm:mr-4 md:mr-8">
              <Link href="/" className="flex items-center gap-1 sm:gap-1.5 group">
                <img 
                  src="/images/tiora_logo.jpeg" 
                  alt="Tiora Logo" 
                  className="h-9 w-9 sm:h-12 sm:w-12 rounded-full object-cover transition-transform duration-300 group-hover:scale-105" 
                />
                <span className="font-playfair text-lg sm:text-xl md:text-2xl font-semibold uppercase tracking-[0.2em] text-[#111111] hover:text-[#B18E35] transition-colors">
                  Tiora
                </span>
              </Link>
            </div>

            {/* Desktop Navigation (Dynamic from DB - moved to home page) */}
            <nav className="hidden lg:flex items-center space-x-6 mr-4">
            </nav>

            <div className="hidden md:flex items-center space-x-4 ml-auto text-brand-dark">
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
                    className="w-full bg-white text-brand-dark pl-9 pr-4 py-2 rounded-none border border-black/10 text-xs focus:outline-none focus:border-brand-accent focus:ring-0 placeholder:text-brand-dark/45 transition-all"
                  />
                </form>
              </div>

              <Link href="/my-story" aria-label="My Story" className="hover:text-brand-accent transition-colors p-2 flex items-center gap-1.5 group">
                <BookOpen className="h-5 w-5" />
                <span className="text-[10px] font-medium uppercase tracking-widest hidden lg:block">My Story</span>
              </Link>

              <Link href="/packages" aria-label="Our Packages" className="hover:text-brand-accent transition-colors p-2 flex items-center gap-1.5 group">
                <Sparkles className="h-5 w-5" />
                <span className="text-[10px] font-medium uppercase tracking-widest hidden lg:block">Our Packages</span>
              </Link>

              <Link
                href={user ? "/wishlist" : `/login?redirect=${encodeURIComponent(pathname)}`}
                aria-label="Wishlist"
                className="hover:text-brand-accent transition-colors flex flex-col items-center justify-center p-1 cursor-pointer group relative min-w-[56px]"
              >
                <div className="relative">
                  <Heart className="h-5 w-5" />
                  {user && wishlistItems.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-white text-[#111111] text-[9px] font-bold px-0.5 rounded-full">
                      {wishlistItems.length}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold mt-1">Wishlist</span>
              </Link>

              <Link 
                href={user ? "/cart" : "/login"} 
                aria-label="Cart" 
                className="hover:text-brand-accent transition-colors flex flex-col items-center justify-center p-1 cursor-pointer group relative min-w-[56px]"
              >
                <div className="relative">
                  <ShoppingBagIcon className="h-5 w-5" />
                  <span className="absolute -top-1.5 -right-1.5 bg-white text-[#111111] text-[9px] font-bold px-0.5 rounded-full">
                    {cartCount}
                  </span>
                </div>
                <span className="text-[10px] font-bold mt-1">Bag</span>
              </Link>
              
              {user ? (
                <ProfileDropdown 
                  user={user} 
                  onLogout={() => setIsLogoutModalOpen(true)} 
                />
              ) : (
                <Link
                  href="/login"
                  className="hover:text-brand-accent transition-colors flex flex-col items-center justify-center p-1 cursor-pointer group relative min-w-[56px]"
                >
                  <User className="h-5 w-5" />
                  <span className="text-[10px] font-bold mt-1">Profile</span>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center space-x-1 sm:space-x-2">
              <button onClick={() => setIsSearchOpen(true)} aria-label="Search" className="text-brand-dark p-1 sm:p-2">
                <Search className="h-5 w-5" />
              </button>
              <Link href="/my-story" aria-label="My Story" className="text-brand-dark p-1 sm:p-2">
                <BookOpen className="h-5 w-5" />
              </Link>
              <Link href="/packages" aria-label="Our Packages" className="text-brand-dark p-1 sm:p-2">
                <Sparkles className="h-5 w-5" />
              </Link>
              <Link
                href={user ? "/wishlist" : `/login?redirect=${encodeURIComponent(pathname)}`}
                aria-label="Wishlist"
                className="text-brand-dark hover:text-brand-accent transition-colors relative p-1 sm:p-2 cursor-pointer"
              >
                <Heart className="h-5 w-5" />
                {user && wishlistItems.length > 0 && (
                  <span className="absolute top-0 right-1 text-[#111111] text-[10px] font-bold">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              <Link href={user ? "/cart" : "/login"} aria-label="Cart" className="text-brand-dark hover:text-brand-accent transition-colors relative p-1 sm:p-2">
                <ShoppingBagIcon className="h-5 w-5" />
                <span className="absolute top-0 right-1 text-[#111111] text-[10px] font-bold">
                  {cartCount}
                </span>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-brand-dark hover:text-brand-accent focus:outline-none p-1 sm:p-2"
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
          <div className="md:hidden bg-white border-t border-black/5 animate-in slide-in-from-top duration-300">
            <div className="px-6 pt-8 pb-12 space-y-4">
              <Link 
                href="/my-story" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#111111] hover:text-[#B18E35] py-2"
              >
                My Story
              </Link>
              <Link 
                href="/packages" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#111111] hover:text-[#B18E35] py-2"
              >
                Our Packages
              </Link>
              
              <div className="pt-8 border-t border-black/5">
                {user ? (
                  <div className="space-y-4">
                    <Link
                      href="/profile"
                      className="flex items-center space-x-4 px-4 py-4 rounded-none bg-neutral-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="w-10 h-10 rounded-full bg-white border border-black/10 flex items-center justify-center text-[#333333] font-bold">
                        {user.fullName?.charAt(0) || "U"}
                      </div>
                      <div>
                        <div className="text-sm font-bold uppercase tracking-widest text-brand-dark">{user.fullName || "My Profile"}</div>
                        <div className="text-[10px] text-brand-dark/40 uppercase tracking-widest">View Details</div>
                      </div>
                    </Link>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsLogoutModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center space-x-3 px-4 py-4 rounded-none border border-red-200 text-red-500 font-bold uppercase tracking-widest text-xs cursor-pointer"
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
                    className="block w-full px-4 py-5 rounded-none text-center text-[10px] font-medium uppercase tracking-[0.2em] text-white bg-[#111111] hover:bg-[#B18E35] relative z-10 cursor-pointer"
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
          <div className="bg-white rounded-none w-full max-w-sm p-8 border border-black/10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertCircle className="text-red-500 h-6 w-6" />
              </div>
              <h3 className="text-xl font-playfair font-bold text-brand mb-2">Log out</h3>
              <p className="text-brand/60 text-sm mb-8 leading-relaxed">
                Are you sure you want to log out from Tiora? You'll need to verify your phone number to sign in again.
              </p>
              
              <div className="w-full space-y-3">
                <button
                  onClick={confirmLogout}
                  disabled={isLoggingOut}
                  className="w-full px-4 py-3.5 rounded-none bg-white border border-red-200 text-red-500 font-bold text-sm tracking-widest uppercase hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
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
                  className="w-full px-4 py-3.5 rounded-none bg-brand text-white font-bold text-sm tracking-widest uppercase hover:bg-brand-hover transition-colors disabled:opacity-50 cursor-pointer"
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
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 rounded-none"
            >
              {/* Header */}
              <div className="p-6 border-b border-black/5 flex items-center justify-between bg-neutral-50">
                <div className="flex items-center space-x-2 text-brand">
                  <Heart className="h-5 w-5 fill-[#333333] text-[#333333]" />
                  <span className="font-playfair text-lg font-bold">My Wishlist ({wishlistItems.length})</span>
                </div>
                <button
                  onClick={() => setIsWishlistOpen(false)}
                  className="p-2 hover:bg-black/5 rounded-none transition-all text-brand cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {wishlistItems.length === 0 ? (
                  <div className="text-center py-20 text-brand/35">
                    <Heart className="mx-auto mb-4 opacity-20 text-brand animate-pulse" size={48} />
                    <p className="text-[10px] font-medium uppercase tracking-[0.25em] mb-4">Your wishlist is empty</p>
                    <button
                      onClick={() => {
                        setIsWishlistOpen(false);
                        router.push("/");
                      }}
                      className="mt-6 text-[10px] font-medium uppercase tracking-widest bg-[#111111] text-white px-6 py-3 rounded-none hover:bg-[#B18E35] transition cursor-pointer"
                    >
                      Explore Collections
                    </button>
                  </div>
                ) : (
                  wishlistItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between p-3 bg-white border border-black/5 rounded-none group transition-all hover:bg-neutral-50"
                    >
                      {/* Thumbnail and Info */}
                      <Link
                        href={`/product/${item.productId}`}
                        onClick={() => setIsWishlistOpen(false)}
                        className="flex items-center space-x-4 flex-1 min-w-0 pr-4"
                      >
                        <div className="w-16 h-20 bg-brand-light/30 rounded-none overflow-hidden flex-shrink-0 border border-black/5">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-brand uppercase tracking-wider truncate mb-0.5">
                            {item.name}
                          </p>
                          <p className="text-[9px] text-[#333333]/60 font-medium uppercase tracking-widest mb-1">
                            {item.category}
                          </p>
                          <p className="text-xs font-semibold text-[#111111]">
                            ₹{item.price.toLocaleString()}
                          </p>
                        </div>
                      </Link>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/product/${item.productId}`}
                          onClick={() => setIsWishlistOpen(false)}
                          className="px-3 py-2 bg-[#111111] text-white text-[9px] font-medium uppercase tracking-widest rounded-none hover:bg-[#B18E35] transition"
                        >
                          Shop
                        </Link>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="p-2 bg-red-50 text-red-500 rounded-none hover:bg-red-100 transition-all cursor-pointer"
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



