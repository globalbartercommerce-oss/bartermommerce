import { pgTable, uuid, varchar, jsonb, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { businesses } from "../merchant/schema";

export const membershipPlans = pgTable("membership_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: jsonb("name").notNull(), // Multi-language json, e.g. { th: "...", en: "..." }
  description: jsonb("description").notNull(),
  priceMonthly: numeric("price_monthly", { precision: 12, scale: 2 }).notNull(),
  priceYearly: numeric("price_yearly", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  features: jsonb("features").default([]).notNull(), // List of permitted feature keys, e.g. ['unlimited_listings', 'global_directory_featured']
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .references(() => businesses.id, { onDelete: "cascade" })
    .notNull(),
  planId: uuid("plan_id")
    .references(() => membershipPlans.id, { onDelete: "restrict" })
    .notNull(),
  status: varchar("status", { length: 50 }).default("trialing").notNull(), // 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const membershipPlansRelations = relations(membershipPlans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  business: one(businesses, {
    fields: [subscriptions.businessId],
    references: [businesses.id],
  }),
  plan: one(membershipPlans, {
    fields: [subscriptions.planId],
    references: [membershipPlans.id],
  }),
}));
