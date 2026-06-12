import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().notNull(), // references Supabase auth.users.id
  email: varchar("email", { length: 255 }).unique().notNull(),
  fullName: varchar("full_name", { length: 255 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  role: varchar("role", { length: 50 }).default("member").notNull(), // 'admin' | 'merchant' | 'member' | 'agent'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userActivityLogs = pgTable("user_activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => profiles.id, { onDelete: "cascade" })
    .notNull(),
  action: varchar("action", { length: 100 }).notNull(), // e.g. 'login', 'kyb_submit', 'token_transfer'
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: varchar("user_agent", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profilesRelations = relations(profiles, ({ many }) => ({
  logs: many(userActivityLogs),
}));

export const userActivityLogsRelations = relations(userActivityLogs, ({ one }) => ({
  user: one(profiles, {
    fields: [userActivityLogs.userId],
    references: [profiles.id],
  }),
}));
