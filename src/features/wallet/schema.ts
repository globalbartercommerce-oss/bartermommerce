import { pgTable, uuid, varchar, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { businesses } from "../merchant/schema";

export const wallets = pgTable("wallets", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .references(() => businesses.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  balance: numeric("balance", { precision: 15, scale: 2 }).default("0.00").notNull(), // Spendable Unicorn Credits (UNC)
  holdBalance: numeric("hold_balance", { precision: 15, scale: 2 }).default("0.00").notNull(), // Credits locked in Escrow
  currency: varchar("currency", { length: 10 }).default("UNC").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ledgerTransactions = pgTable("ledger_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  fromWalletId: uuid("from_wallet_id")
    .references(() => wallets.id, { onDelete: "set null" }), // Nullable for system minting/deposits
  toWalletId: uuid("to_wallet_id")
    .references(() => wallets.id, { onDelete: "set null" }), // Nullable for system burning/withdrawals
  transactionType: varchar("transaction_type", { length: 50 }).notNull(), // 'barter_payment' | 'barter_fee' | 'escrow_hold' | 'escrow_release' | 'topup' | 'withdraw'
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  referenceId: uuid("reference_id"), // Reference to barter_offers, settlements, etc.
  description: text("description"),
  status: varchar("status", { length: 50 }).default("completed").notNull(), // 'completed' | 'pending' | 'failed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  business: one(businesses, {
    fields: [wallets.businessId],
    references: [businesses.id],
  }),
  sentTransactions: many(ledgerTransactions, { relationName: "sender_wallet" }),
  receivedTransactions: many(ledgerTransactions, { relationName: "receiver_wallet" }),
}));

export const ledgerTransactionsRelations = relations(ledgerTransactions, ({ one }) => ({
  fromWallet: one(wallets, {
    fields: [ledgerTransactions.fromWalletId],
    references: [wallets.id],
    relationName: "sender_wallet",
  }),
  toWallet: one(wallets, {
    fields: [ledgerTransactions.toWalletId],
    references: [wallets.id],
    relationName: "receiver_wallet",
  }),
}));
