import { pgTable, uuid, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { barterOffers } from "../barter/schema";
import { listings } from "../marketplace/schema";

export const aiMatches = pgTable("ai_matches", {
  id: uuid("id").defaultRandom().primaryKey(),
  offerId: uuid("offer_id")
    .references(() => barterOffers.id, { onDelete: "set null" }), // Nullable if it is just a recommendation not yet turned into an offer
  listingAId: uuid("listing_a_id")
    .references(() => listings.id, { onDelete: "cascade" })
    .notNull(),
  listingBId: uuid("listing_b_id")
    .references(() => listings.id, { onDelete: "cascade" })
    .notNull(),
  similarityScore: numeric("similarity_score", { precision: 5, scale: 4 }).notNull(), // Matching probability score between 0.0000 and 1.0000
  matchRationale: text("match_rationale"), // Description of why the AI matched these items
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiMatchesRelations = relations(aiMatches, ({ one }) => ({
  offer: one(barterOffers, {
    fields: [aiMatches.offerId],
    references: [barterOffers.id],
  }),
  listingA: one(listings, {
    fields: [aiMatches.listingAId],
    references: [listings.id],
    relationName: "listing_a",
  }),
  listingB: one(listings, {
    fields: [aiMatches.listingBId],
    references: [listings.id],
    relationName: "listing_b",
  }),
}));
export const listingsAiRelations = relations(listings, ({ many }) => ({
  matchesAsA: many(aiMatches, { relationName: "listing_a" }),
  matchesAsB: many(aiMatches, { relationName: "listing_b" }),
}));
