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
  LayoutGrid,
  Tag
} from "lucide-react";

const sidebarLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  { name: "Inventory", href: "/admin/inventory", icon: Box },
  { name: "Orders", href: "/admin/orders", icon: Package },
  { name: "Navbar Settings", href: "/admin/navigation", icon: Map },
  { name: "Products", href: "/admin/products", icon: Shirt },
  { name: "Category Settings", href: "/admin/categories", icon: LayoutGrid },
  { name: "Package Cards", href: "/admin/packages", icon: Sparkles },
  { name: "Coupons", href: "/admin/coupons", icon: Tag },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Site Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Don't show sidebar on login/denied pages
  if (pathname === "/admin/login" || pathname === "/admin/denied") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <div className="flex h-screen bg-brand-light font-inter overflow-hidden relative">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Desktop Top Left Hover Trigger */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 hidden lg:flex group w-12 h-12 items-center justify-center bg-[#0E2C2C] border border-[#0E2C2C] rounded-none cursor-pointer shadow-sm hover:border-[#B18E35] transition-colors"
          title="Show Dashboard Menu"
        >
          {/* Logo (visible by default, hidden on hover) */}
          <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-200 group-hover:opacity-0">
            <img
              src="/images/tiora_logo.jpeg"
              alt="Tiora Logo"
              className="w-8 h-8 rounded-full object-cover"
            />
          </div>
          {/* Dashboard Icon (hidden by default, visible on hover) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-white group-hover:text-[#B18E35]">
            <LayoutDashboard size={22} />
          </div>
        </button>
      )}

      {/* Mobile Top Left Trigger (No hover, shows dashboard icon directly) */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 flex lg:hidden w-12 h-12 items-center justify-center bg-[#0E2C2C] border border-[#0E2C2C] rounded-none cursor-pointer shadow-sm text-white hover:text-[#B18E35] transition-colors"
          title="Show Dashboard Menu"
        >
          <LayoutDashboard size={22} />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`w-60 bg-[#333333] text-white flex flex-col shadow-2xl fixed inset-y-0 left-0 z-50 transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-white/5 relative flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <img
              src="/images/tiora_logo.jpeg"
              alt="Tiora Logo"
              className="w-8 h-8 rounded-full object-cover border border-white/10 transition-transform duration-300 group-hover:scale-105"
            />
            <span className="font-playfair text-lg font-semibold uppercase tracking-[0.15em] text-white">
              Tiora
            </span>
          </Link>

          {/* Close Sidebar Button (Dashboard Icon at top right edge of side panel) */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 hover:bg-white/10 rounded transition-colors text-white/80 hover:text-white cursor-pointer"
            title="Hide Dashboard Menu"
          >
            <LayoutDashboard size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto min-h-0 p-4 space-y-1 mt-4 custom-scrollbar">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => {
                  // Close sidebar on mobile when a link is clicked
                  if (window.innerWidth < 1024) {
                    setIsSidebarOpen(false);
                  }
                }}
                className={`flex items-center justify-between px-3 py-3 rounded-xl transition-all group ${isActive
                    ? "bg-[#faf8f0] text-[#333333] shadow-lg translate-x-1"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
              >
                <div className="flex items-center space-x-4">
                  <Icon size={18} className={isActive ? "text-[#333333]" : "text-[#faf8f0]/60 group-hover:text-[#faf8f0]"} />
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
      <main
        className={`flex-1 min-w-0 h-full overflow-hidden flex flex-col transition-all duration-300 pt-16 lg:pt-0 ${
          isSidebarOpen ? "lg:ml-60 ml-0 lg:pl-0" : "ml-0 lg:pl-20"
        }`}
      >
        {/* Header decoration */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#333333]/20 to-transparent flex-shrink-0"></div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#333333]/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-brand-dark mb-2">Confirm Logout</h3>
              <p className="text-brand-dark/60 text-sm mb-8">Are you sure you want to exit the admin panel? You will need to login again to access these settings.</p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-brand-dark/40 hover:text-brand-dark hover:bg-brand-light transition-all"
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
              className="absolute top-4 right-4 p-2 text-brand-dark/20 hover:text-brand-dark transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
