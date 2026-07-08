import { sqliteTable, text, integer, blob, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  phoneNumber: text("phone_number").notNull().unique(),
  fullName: text("full_name"),
  role: text("role").default("user"), // user, admin
  address: text("address"), // Default shipping address
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  lastLoginAt: text("last_login_at"),
});

export const otpVerifications = sqliteTable("otp_verifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  phoneNumber: text("phone_number").notNull(),
  otp: text("otp").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});


export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  basePrice: real("base_price").notNull(),
  salePrice: real("sale_price"),
  avgRating: real("avg_rating").default(4.3),
  numReviews: integer("num_reviews").default(1),
  images: text("images"), // JSON string array of URLs
  colors: text("colors"),  // JSON string array of colour names
  gender: text("gender", { enum: ["men", "women", "unisex"] }),
  category: text("category"),
  filterCategory: text("filter_category"),
  tags: text("tags"),       // comma-separated tags
  isFeatured: integer("is_featured", { mode: "boolean" }).default(false),
  isCustomizable: integer("is_customizable", { mode: "boolean" }).default(false),
  enabledMeasurements: text("enabled_measurements"), // JSON string array
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const productVariations = sqliteTable("product_variations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }),
  size: text("size").notNull(),
  stock: integer("stock").notNull().default(0),
  sku: text("sku"),
  color: text("color"),
  mrp: real("mrp"),
  salePrice: real("sale_price"),
});

export const productCustomisationRules = sqliteTable("product_customisation_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").references(() => products.id),
  attributeName: text("attribute_name"), 
  minAdjustment: real("min_adjustment"), 
  maxAdjustment: real("max_adjustment"), 
  step: real("step"), 
});

export const cartItems = sqliteTable("cart_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id), 
  productId: integer("product_id").references(() => products.id),
  baseSize: text("base_size").notNull(), 
  customSpecifications: blob("custom_specifications", { mode: "json" }), 
  itemHash: text("item_hash").notNull(), 
  quantity: integer("quantity").notNull().default(1),
  price: real("price").notNull(),
});


export const navigationMenu = sqliteTable("navigation_menu", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  href: text("href").notNull(),
  imageUrl: text("image_url"),
  order: integer("order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  filterTypes: text("filter_types"),
});

export const pageSections = sqliteTable("page_sections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  menuId: integer("menu_id").notNull().references(() => navigationMenu.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  productIds: text("product_ids").notNull(), // Comma-separated or JSON string of product IDs
  displayOrder: integer("display_order").notNull().default(0),
});



export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  totalAmount: real("total_amount").notNull(),
  discountAmount: real("discount_amount").default(0),
  couponCode: text("coupon_code"),
  status: text("status").default("pending"), // pending, processing, shipped, delivered, cancelled
  shippingAddress: text("shipping_address"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const coupons = sqliteTable("coupons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  description: text("description"), // newly added description
  type: text("type").notNull(), // FLAT or PERCENTAGE
  value: real("value").notNull(), // Amount or percentage
  minOrderValue: real("min_order_value").default(0),
  maxDiscount: real("max_discount"), // For percentage caps
  isFirstOrderOnly: integer("is_first_order_only", { mode: "boolean" }).default(false),
  applicableCategories: text("applicable_categories"), // comma-separated names
  applicableProducts: text("applicable_products"), // comma-separated product IDs
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  variationId: integer("variation_id").references(() => productVariations.id),
  quantity: integer("quantity").notNull().default(1),
  price: real("price").notNull(),
  size: text("size").notNull(),
  color: text("color"),
  customizations: text("customizations"), // JSON string of bespoke measurements
});

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const offerBanners = sqliteTable("offer_banners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  text: text("text").notNull(),
  link: text("link"),
  order: integer("order").notNull().default(0),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const homepageCategories = sqliteTable("homepage_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  promoText: text("promo_text").notNull().default(""),
  actionText: text("action_text").default("Shop Now"),
  link: text("link"),
  order: integer("order").notNull().default(0),
  filterTypes: text("filter_types"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const wishlists = sqliteTable("wishlists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const servicePackages = sqliteTable("service_packages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryTitle: text("category_title").notNull(),
  categoryTagline: text("category_tagline").notNull(),
  categoryBgImage: text("category_bg_image").notNull(),
  categoryIcon: text("category_icon").notNull().default("Crown"),
  categoryThemeColor: text("category_theme_color").notNull().default("#C5A059"),
  tierName: text("tier_name").notNull(),
  price: text("price").notNull(),
  features: text("features").notNull(), // JSON string array
  upgradeBenefit: text("upgrade_benefit"),
  whatsappMsg: text("whatsapp_msg").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});



