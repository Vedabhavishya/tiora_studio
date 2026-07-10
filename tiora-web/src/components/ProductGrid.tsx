"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ProductCard from './ProductCard';
import { Loader2 } from "lucide-react";
import { getFirstProductImageUrl, getProductImageUrls } from "@/utils/product";


interface Product {
  id: number;
  name: string;
  description: string;
  salePrice: number;
  basePrice: number;
  images: string; // JSON string
  category?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch("/api/products/featured");
        const data = await res.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (error) {
        console.warn("Failed to fetch featured products", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-brand-accent mb-4" size={40} />
        <p className="text-brand/40 font-bold uppercase tracking-widest text-xs">Curating Collections...</p>
      </div>
    );
  }

  return (
    <section className="pt-4 pb-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center text-center mb-12"
      >
        <div>
          <h2 className="text-3xl md:text-4xl font-playfair font-light tracking-widest text-[#111111] uppercase mb-2">Featured Collections</h2>
          <p className="text-brand-accent text-xs uppercase tracking-widest font-medium">Crafted for elegance. Tailored for you.</p>
        </div>
      </motion.div>

      {products.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-black/10 rounded-none">
          <p className="text-brand/40 font-medium uppercase tracking-widest text-[10px]">New collections coming soon</p>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
        >
          {products.map((product: any) => {
            const parsedImages = getProductImageUrls(product.images, product.colors);
            const firstImage = getFirstProductImageUrl(product.images, product.colors);
            
            return (
              <motion.div key={product.id} variants={itemVariants}>
                <ProductCard 
                  product={{
                    id: product.id.toString(),
                    name: product.name,
                    description: product.description || "",
                    price: product.salePrice || product.basePrice,
                    basePrice: product.basePrice,
                    salePrice: product.salePrice,
                    imageUrl: firstImage,
                    images: parsedImages,
                    categorySlug: product.category || "all",
                    isCustomizable: product.isCustomizable
                  }} 
                />
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </section>
  );
}
