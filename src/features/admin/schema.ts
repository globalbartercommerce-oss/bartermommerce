import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { escrows } from "../escrow/schema";
import { businesses } from "../merchant/schema";
import { profiles } from "../identity/schema";

export const adminDisputes = pgTable("admin_disputes", {
  id: uuid("id").defaultRandom().primaryKey(),
  escrowId: uuid("escrow_id")
    .references(() => escrows.id, { onDelete: "cascade" })
    .notNull(),
  raisedByBusinessId: uuid("raised_by_business_id")
    .references(() => businesses.id, { onDelete: "cascade" })
    .notNull(),
  assignedAdminId: uuid("assigned_admin_id")
    .references(() => profiles.id, { onDelete: "set null" }), // Nullable if not yet assigned to an admin staff
  status: varchar("status", { length: 50 }).default("open").notNull(), // 'open' | 'investigating' | 'resolved' | 'closed'
  resolutionDetails: text("resolution_details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const adminDisputesRelations = relations(adminDisputes, ({ one }) => ({
  escrow: one(escrows, {
    fields: [adminDisputes.escrowId],
    references: [escrows.id],
  }),
  raisedBy: one(businesses, {
    fields: [adminDisputes.raisedByBusinessId],
    references: [businesses.id],
  }),
  assignedAdmin: one(profiles, {
    fields: [adminDisputes.assignedAdminId],
    references: [profiles.id],
  }),
}));
