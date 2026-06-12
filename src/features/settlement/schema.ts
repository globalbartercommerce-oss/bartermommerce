import { pgTable, uuid, varchar, numeric, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { businesses } from "../merchant/schema";

export const settlements = pgTable("settlements", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .references(() => businesses.id, { onDelete: "cascade" })
    .notNull(),
  paymentGateway: varchar("payment_gateway", { length: 50 }).notNull(), // 'stripe' | 'wise'
  gatewayTransactionId: varchar("gateway_transaction_id", { length: 255 }).unique().notNull(), // External transaction hash/ID
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(), // Fiat monetary amount
  currency: varchar("currency", { length: 10 }).notNull(), // e.g. 'USD', 'THB'
  direction: varchar("direction", { length: 20 }).notNull(), // 'inbound' (deposit/top-up) | 'outbound' (withdrawal/payout)
  status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending' | 'completed' | 'failed' | 'refunded'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const settlementsRelations = relations(settlements, ({ one }) => ({
  business: one(businesses, {
    fields: [settlements.businessId],
    references: [businesses.id],
  }),
}));
