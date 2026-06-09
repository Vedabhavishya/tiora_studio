import React from "react";
import { Truck, Sparkles } from "lucide-react";

export const metadata = {
  title: "Shipping & Delivery - Ashwaah",
  description: "Shipping and delivery information for Ashwaah custom fit apparel.",
};

export default function ShippingDelivery() {
  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-[#FCFBF8] via-[#FDFBF7] to-[#F7F3EB] py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[#C5A059] font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">Information</span>
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-[#1B3022] leading-tight mb-4 flex items-center justify-center gap-3">
            Shipping & Delivery <Sparkles size={24} className="text-[#C5A059]" />
          </h1>
          <div className="w-20 h-1 bg-[#C5A059] mx-auto rounded-full"></div>
        </div>

        <div className="bg-[#FFFDF6] p-8 md:p-12 rounded-[2.5rem] border border-brand/5 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-[#1B3022]/5 flex items-center justify-center mx-auto mb-6">
            <Truck size={32} className="text-[#C5A059]" />
          </div>
          
          <h2 className="text-2xl font-playfair font-bold text-[#1B3022] mb-4">Under Construction</h2>
          <p className="text-lg text-[#1B3022]/70 font-medium leading-relaxed max-w-lg mx-auto mb-8">
            We are currently drafting our detailed Shipping & Delivery policies to ensure the best shopping and customized fitting experience for you. 
          </p>

          <div className="pt-6 border-t border-brand/5 max-w-md mx-auto">
            <p className="text-sm text-[#1B3022]/60 font-semibold mb-2">Have questions in the meantime?</p>
            <p className="text-base font-bold text-[#1B3022]">
              Contact us at{" "}
              <a href="mailto:ashwaah2627@gmail.com" className="text-[#C5A059] hover:underline">
                ashwaah2627@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
