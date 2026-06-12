import { pgTable, uuid, varchar, text, jsonb, numeric, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { businesses } from "../merchant/schema";
import { directoryCategories } from "../directory/schema";

export const listings = pgTable("listings", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .references(() => businesses.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  categoryId: uuid("category_id")
    .references(() => directoryCategories.id, { onDelete: "set null" }),
  type: varchar("type", { length: 50 }).notNull(), // 'goods' | 'service'
  estimatedValue: numeric("estimated_value", { precision: 12, scale: 2 }).notNull(), // Estimated fiat value in USD/THB
  priceCredits: numeric("price_credits", { precision: 12, scale: 2 }).notNull(), // Value in internal Unicorn Credits (UNC)
  condition: varchar("condition", { length: 50 }).notNull(), // 'new' | 'used_like_new' | 'used_good' | 'used_fair'
  images: text("images").array(), // Array of image URLs hosted on Cloudflare R2
  status: varchar("status", { length: 50 }).default("active").notNull(), // 'active' | 'draft' | 'sold' | 'inactive'
  metadata: jsonb("metadata").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const listingsRelations = relations(listings, ({ one }) => ({
  business: one(businesses, {
    fields: [listings.businessId],
    references: [businesses.id],
  }),
  category: one(directoryCategories, {
    fields: [listings.categoryId],
    references: [directoryCategories.id],
  }),
}));
