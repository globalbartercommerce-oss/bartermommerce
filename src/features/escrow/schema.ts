import { pgTable, uuid, varchar, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { barterOffers } from "../barter/schema";
import { wallets } from "../wallet/schema";

export const escrows = pgTable("escrows", {
  id: uuid("id").defaultRandom().primaryKey(),
  offerId: uuid("offer_id")
    .references(() => barterOffers.id, { onDelete: "cascade" })
    .notNull(),
  senderWalletId: uuid("sender_wallet_id")
    .references(() => wallets.id, { onDelete: "restrict" })
    .notNull(),
  receiverWalletId: uuid("receiver_wallet_id")
    .references(() => wallets.id, { onDelete: "restrict" })
    .notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(), // Amount of credits locked
  status: varchar("status", { length: 50 }).default("held").notNull(), // 'held' | 'released' | 'refunded' | 'disputed'
  disputeReason: text("dispute_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const escrowsRelations = relations(escrows, ({ one }) => ({
  offer: one(barterOffers, {
    fields: [escrows.offerId],
    references: [barterOffers.id],
  }),
  senderWallet: one(wallets, {
    fields: [escrows.senderWalletId],
    references: [wallets.id],
    relationName: "sender_escrow_wallet",
  }),
  receiverWallet: one(wallets, {
    fields: [escrows.receiverWalletId],
    references: [wallets.id],
    relationName: "receiver_escrow_wallet",
  }),
}));
export const walletsEscrowRelations = relations(wallets, ({ many }) => ({
  sentEscrows: many(escrows, { relationName: "sender_escrow_wallet" }),
  receivedEscrows: many(escrows, { relationName: "receiver_escrow_wallet" }),
}));
