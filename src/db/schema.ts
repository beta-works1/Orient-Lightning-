import {
  pgTable,
  text,
  numeric,
  timestamp,
  jsonb,
  uuid,
  primaryKey,
} from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  handle: text("handle").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  compareAtPrice: numeric("compare_at_price", { precision: 12, scale: 2 }),
  sku: text("sku").notNull().default(""),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  variants: jsonb("variants")
    .$type<
      {
        id: string;
        title: string;
        price: number;
        compareAtPrice?: number | null;
        sku: string;
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  publishedAt: timestamp("published_at"),
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
  createdAt: timestamp("created_at").defaultNow(),
});
