"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Map, 
  Shirt, 
  Package, 
  Users, 
  LogOut,
  ChevronRight,
  Sparkles,
  Box,
  BarChart3,
  AlertTriangle,
  X,
  Settings,
  LayoutGrid
} from "lucide-react";

const sidebarLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  { name: "Inventory", href: "/admin/inventory", icon: Box },
  { name: "Orders", href: "/admin/orders", icon: Package },
  { name: "Navbar Settings", href: "/admin/navigation", icon: Map },
  { name: "Products", href: "/admin/products", icon: Shirt },
  { name: "Category Settings", href: "/admin/categories", icon: LayoutGrid },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Site Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Don't show sidebar on login/denied pages
  if (pathname === "/admin/login" || pathname === "/admin/denied") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <div className="flex h-screen bg-brand-light font-inter overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-[#1B3022] text-white flex flex-col shadow-2xl fixed inset-y-0 z-50">
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 bg-[#C5A059] rounded-lg flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
              <span className="font-serif font-bold text-lg text-[#1B3022]">A</span>
            </div>
            <div>
              <span className="font-playfair font-medium text-lg tracking-wide leading-none block">Ashwaah</span>
              <p className="text-[8px] uppercase tracking-[0.2em] text-[#C5A059] font-black mt-1">Admin Panel</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-4">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center justify-between px-3 py-3 rounded-xl transition-all group ${
                  isActive 
                    ? "bg-[#C5A059] text-[#1B3022] shadow-lg translate-x-1" 
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <Icon size={18} className={isActive ? "text-[#1B3022]" : "text-[#C5A059]/60 group-hover:text-[#C5A059]"} />
                  <span className="text-sm font-bold tracking-tight">{link.name}</span>
                </div>
                {isActive && <ChevronRight size={14} className="opacity-50" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center space-x-4 px-4 py-4 rounded-2xl text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all group"
          >
            <LogOut size={18} />
            <span className="text-sm font-bold tracking-tight">Logout</span>
          </button>
        </div>
      </aside>


      {/* Main Content */}
      <main className="flex-1 ml-60 min-w-0 h-full overflow-hidden flex flex-col">
        {/* Header decoration */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#C5A059]/20 to-transparent flex-shrink-0"></div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#1B3022]/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-[#1B3022] mb-2">Confirm Logout</h3>
              <p className="text-[#1B3022]/60 text-sm mb-8">Are you sure you want to exit the admin panel? You will need to login again to access these settings.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-[#1B3022]/40 hover:text-[#1B3022] hover:bg-brand-light transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLogout}
                  className="px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Logout
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute top-4 right-4 p-2 text-[#1B3022]/20 hover:text-[#1B3022] transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
