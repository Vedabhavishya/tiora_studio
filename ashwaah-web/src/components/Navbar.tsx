"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingCart, User, Menu, X, LogOut, AlertCircle, BookOpen } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";
import SearchModal from "./SearchModal";
import { useCartStore } from "@/store/useCartStore";

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
        } else {
          setUser(null);
          // If the user is logged out, ensure the cart is empty
          if (cartItems.length > 0) {
            clearCart();
          }
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
      <header className="sticky top-0 z-50 w-full bg-[#1B2A4A] border-b border-white/10 shadow-lg font-inter">
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
                <span className="font-playfair text-xl md:text-2xl font-bold text-white tracking-tighter hover:text-[#C5A059] transition-colors">
                  Ashwaah
                </span>
              </Link>
            </div>

            {/* Desktop Navigation (Dynamic from DB - moved to home page) */}
            <nav className="hidden lg:flex items-center space-x-6 mr-4">
            </nav>

            <div className="hidden md:flex items-center space-x-4 ml-auto text-white">
              {/* Amazon Style Search Bar */}
              <div className="max-w-[280px] md:w-[280px]">
                <form onSubmit={handleSearchSubmit} className="w-full flex">
                  <div className="relative flex-1">
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Ashwaah..."
                      className="w-full bg-white text-brand-dark px-3 py-2 rounded-l-md text-xs focus:outline-none placeholder:text-brand-dark/40"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="bg-[#C5A059] hover:bg-[#B38E46] text-white px-3 rounded-r-md transition-colors flex items-center justify-center"
                  >
                    <Search size={16} strokeWidth={2.5} />
                  </button>
                </form>
              </div>

              <Link href="/my-story" aria-label="My Story" className="hover:text-[#C5A059] transition-colors p-2 flex items-center gap-1.5 group">
                <BookOpen className="h-5 w-5" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block opacity-0 group-hover:opacity-100 transition-opacity">My Story</span>
              </Link>

              <Link href={user ? "/cart" : "/login"} aria-label="Cart" className="hover:text-[#C5A059] transition-colors relative p-2">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute top-0 right-0 bg-[#C5A059] text-white text-[8px] font-black h-3.5 w-3.5 rounded-full flex items-center justify-center border-2 border-[#1B2A4A]">
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
              <Link href={user ? "/cart" : "/login"} aria-label="Cart" className="text-white relative p-2">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute top-0 right-0 bg-[#C5A059] text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-[#1B2A4A]">
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
          <div className="md:hidden bg-[#1B2A4A] border-t border-white/10 animate-in slide-in-from-top duration-300">
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
                      <div className="w-10 h-10 rounded-full bg-[#C5A059] flex items-center justify-center text-white font-bold">
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
    </>
  );
}



