import { pgTable, uuid, varchar, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { profiles } from "../identity/schema";

export const businesses = pgTable("businesses", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id")
    .references(() => profiles.id, { onDelete: "cascade" })
    .notNull(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  registrationNumber: varchar("registration_number", { length: 100 }).unique().notNull(), // Tax ID / Commerce Reg. No.
  verificationStatus: varchar("verification_status", { length: 50 }).default("pending").notNull(), // 'pending' | 'approved' | 'rejected'
  verificationNotes: text("verification_notes"),
  countryCode: varchar("country_code", { length: 10 }).notNull(), // e.g. 'TH', 'US'
  industry: varchar("industry", { length: 100 }).notNull(),
  logoUrl: varchar("logo_url", { length: 500 }),
  websiteUrl: varchar("website_url", { length: 500 }),
  phone: varchar("phone", { length: 50 }),
  metadata: jsonb("metadata").default({}).notNull(), // dynamic fields like address, exports information
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const businessVerificationDocuments = pgTable("business_verification_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .references(() => businesses.id, { onDelete: "cascade" })
    .notNull(),
  documentType: varchar("document_type", { length: 100 }).notNull(), // e.g. 'company_registration', 'tax_certificate', 'fda_certificate'
  documentUrl: varchar("document_url", { length: 500 }).notNull(), // Cloudflare R2 file path
  status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending' | 'approved' | 'rejected'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [businesses.ownerId],
    references: [profiles.id],
  }),
  documents: many(businessVerificationDocuments),
}));

export const businessVerificationDocumentsRelations = relations(businessVerificationDocuments, ({ one }) => ({
  business: one(businesses, {
    fields: [businessVerificationDocuments.businessId],
    references: [businesses.id],
  }),
}));
