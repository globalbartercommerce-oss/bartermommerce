import { pgTable, uuid, varchar, jsonb, boolean, timestamp, numeric, customType, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { businesses } from "../merchant/schema";

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const directoryCategories = pgTable("directory_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: jsonb("name").notNull(), // Multi-language json, e.g. { th: "...", en: "..." }
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  parentId: uuid("parent_id"), // Self-referencing (can be nullable for top-level categories)
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const businessDirectoryListings = pgTable("business_directory_listings", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .references(() => businesses.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  categoryId: uuid("category_id")
    .references(() => directoryCategories.id, { onDelete: "set null" }),
  isFeatured: boolean("is_featured").default(false).notNull(),
  searchVector: tsvector("search_vector"), // For database-level full-text indexing
  reviewsAvgRating: numeric("reviews_avg_rating", { precision: 3, scale: 2 }).default("0.00").notNull(),
  reviewsCount: numeric("reviews_count").default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tradeAssociations = pgTable("trade_associations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: jsonb("name").notNull(), // Multi-language json
  description: jsonb("description").notNull(),
  countryCode: varchar("country_code", { length: 10 }).notNull(),
  logoUrl: varchar("logo_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const businessAssociationMembers = pgTable(
  "business_association_members",
  {
    businessId: uuid("business_id")
      .references(() => businesses.id, { onDelete: "cascade" })
      .notNull(),
    associationId: uuid("association_id")
      .references(() => tradeAssociations.id, { onDelete: "cascade" })
      .notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.businessId, table.associationId] }),
  })
);

// Self-referencing relationships and listing connections
export const directoryCategoriesRelations = relations(directoryCategories, ({ one, many }) => ({
  parent: one(directoryCategories, {
    fields: [directoryCategories.parentId],
    references: [directoryCategories.id],
    relationName: "parent_category",
  }),
  subcategories: many(directoryCategories, {
    relationName: "parent_category",
  }),
  listings: many(businessDirectoryListings),
}));

export const businessDirectoryListingsRelations = relations(businessDirectoryListings, ({ one }) => ({
  business: one(businesses, {
    fields: [businessDirectoryListings.businessId],
    references: [businesses.id],
  }),
  category: one(directoryCategories, {
    fields: [businessDirectoryListings.categoryId],
    references: [directoryCategories.id],
  }),
}));

export const tradeAssociationsRelations = relations(tradeAssociations, ({ many }) => ({
  members: many(businessAssociationMembers),
}));

export const businessAssociationMembersRelations = relations(businessAssociationMembers, ({ one }) => ({
  business: one(businesses, {
    fields: [businessAssociationMembers.businessId],
    references: [businesses.id],
  }),
  association: one(tradeAssociations, {
    fields: [businessAssociationMembers.associationId],
    references: [tradeAssociations.id],
  }),
}));
