"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, Package, Settings, LogOut, ChevronDown, MapPin } from "lucide-react";

interface ProfileDropdownProps {
  user: {
    fullName: string | null;
    phoneNumber: string;
  };
  onLogout: () => void;
}

export default function ProfileDropdown({ user, onLogout }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close when navigating
  useEffect(() => {
    setIsOpen(false);
  }, [user]);

  const initials = user.fullName ? user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 1) : "U";

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center bg-white/5 w-10 h-10 rounded-full hover:bg-white/10 transition-all border border-white/5 group"
      >
        <div className="w-7 h-7 rounded-full bg-[#FFFDF6] flex items-center justify-center text-[10px] text-[#064e3b] font-bold shadow-sm">
          {initials}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-brand/5 overflow-hidden z-[60] animate-in slide-in-from-top-2 duration-200">
          <div className="p-5 bg-brand/5 border-b border-brand/5">
            <div className="text-sm font-bold text-brand truncate">{user.fullName || "User"}</div>
            <div className="text-[10px] text-brand/40 tracking-widest uppercase font-medium mt-1">{user.phoneNumber}</div>
          </div>
          
          <div className="p-2">
            <Link 
              href="/account/profile" 
              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-brand/70 hover:bg-brand/5 hover:text-brand transition-all group"
              onClick={() => setIsOpen(false)}
            >
              <div className="p-2 rounded-lg bg-brand/5 group-hover:bg-white transition-colors">
                <Settings size={16} />
              </div>
              <span className="text-sm font-bold tracking-tight">Edit Profile</span>
            </Link>

            <Link 
              href="/account/address" 
              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-brand/70 hover:bg-brand/5 hover:text-brand transition-all group"
              onClick={() => setIsOpen(false)}
            >
              <div className="p-2 rounded-lg bg-brand/5 group-hover:bg-white transition-colors">
                <MapPin size={16} />
              </div>
              <span className="text-sm font-bold tracking-tight">My Address</span>
            </Link>
            
            <Link 
              href="/profile/orders" 
              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-brand/70 hover:bg-brand/5 hover:text-brand transition-all group"
              onClick={() => setIsOpen(false)}
            >
              <div className="p-2 rounded-lg bg-brand/5 group-hover:bg-white transition-colors">
                <Package size={16} />
              </div>
              <span className="text-sm font-bold tracking-tight">My Orders</span>
            </Link>
          </div>
          
          <div className="p-2 border-t border-brand/5">
            <button 
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all group"
            >
              <div className="p-2 rounded-lg bg-red-50 group-hover:bg-white transition-colors">
                <LogOut size={16} />
              </div>
              <span className="text-sm font-bold tracking-tight">Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
