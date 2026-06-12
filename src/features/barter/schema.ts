import { pgTable, uuid, varchar, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { businesses } from "../merchant/schema";
import { listings } from "../marketplace/schema";

export const barterOffers = pgTable("barter_offers", {
  id: uuid("id").defaultRandom().primaryKey(),
  senderBusinessId: uuid("sender_business_id")
    .references(() => businesses.id, { onDelete: "cascade" })
    .notNull(),
  receiverBusinessId: uuid("receiver_business_id")
    .references(() => businesses.id, { onDelete: "cascade" })
    .notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending' | 'accepted' | 'declined' | 'escrowed' | 'completed' | 'cancelled'
  termsDescription: text("terms_description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const barterOfferItems = pgTable("barter_offer_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  offerId: uuid("offer_id")
    .references(() => barterOffers.id, { onDelete: "cascade" })
    .notNull(),
  listingId: uuid("listing_id")
    .references(() => listings.id, { onDelete: "cascade" })
    .notNull(),
  quantity: integer("quantity").default(1).notNull(),
  creditsValue: numeric("credits_value", { precision: 12, scale: 2 }).notNull(), // Unicorn Credits value per unit
  direction: varchar("direction", { length: 50 }).notNull(), // 'sender_to_receiver' | 'receiver_to_sender'
});

export const barterOffersRelations = relations(barterOffers, ({ one, many }) => ({
  sender: one(businesses, {
    fields: [barterOffers.senderBusinessId],
    references: [businesses.id],
    relationName: "sender_business",
  }),
  receiver: one(businesses, {
    fields: [barterOffers.receiverBusinessId],
    references: [businesses.id],
    relationName: "receiver_business",
  }),
  items: many(barterOfferItems),
}));

export const barterOfferItemsRelations = relations(barterOfferItems, ({ one }) => ({
  offer: one(barterOffers, {
    fields: [barterOfferItems.offerId],
    references: [barterOffers.id],
  }),
  listing: one(listings, {
    fields: [barterOfferItems.listingId],
    references: [listings.id],
  }),
}));
