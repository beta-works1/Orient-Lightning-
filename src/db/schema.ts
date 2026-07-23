import {
  pgTable,
  text,
  numeric,
  timestamp,
  jsonb,
  uuid,
  primaryKey,
  boolean,
  doublePrecision,
} from "drizzle-orm/pg-core";

export type ProductStatus = "draft" | "published";

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  handle: text("handle").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  compareAtPrice: numeric("compare_at_price", { precision: 12, scale: 2 }),
  sku: text("sku").notNull().default(""),
  productType: text("product_type").notNull().default(""),
  vendor: text("vendor").notNull().default("Orient"),
  status: text("status").$type<ProductStatus>().notNull().default("published"),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  variants: jsonb("variants")
    .$type<
      {
        id: string;
        title: string;
        price: number;
        compareAtPrice?: number | null;
        sku: string;
        available?: boolean;
        option1?: string | null;
        option2?: string | null;
        option3?: string | null;
      }[]
    >()
    .notNull()
    .default([]),
  options: jsonb("options").$type<{ name: string; values: string[] }[]>().default([]),
  tags: jsonb("tags").$type<string[]>().default([]),
  facets: jsonb("facets")
    .$type<{ wattage: string[]; colorTemp: string[] }>()
    .default({ wattage: [], colorTemp: [] }),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const collections = pgTable("collections", {
  id: text("id").primaryKey(),
  handle: text("handle").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  image: text("image"),
});

export const productCollections = pgTable(
  "product_collections",
  {
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.collectionId] })],
);

export const blogPosts = pgTable("blog_posts", {
  id: text("id").primaryKey(),
  handle: text("handle").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  body: text("body").notNull().default(""),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  image: text("image"),
});

export const pages = pgTable("pages", {
  id: text("id").primaryKey(),
  handle: text("handle").notNull().unique(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const dealers = pgTable("dealers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").$type<"flagship" | "authorized_dealer">().notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  hours: text("hours"),
  verified: boolean("verified").notNull().default(false),
  isWalkIn: boolean("is_walk_in").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
