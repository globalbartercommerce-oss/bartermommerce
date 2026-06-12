import { pgTable, uuid, varchar, jsonb, timestamp, numeric, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { businesses } from "../merchant/schema";

export const communities = pgTable("communities", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: jsonb("name").notNull(), // Multi-language name e.g. { th: "...", en: "..." }
  description: jsonb("description").notNull(),
  logoUrl: varchar("logo_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const communityMembers = pgTable(
  "community_members",
  {
    communityId: uuid("community_id")
      .references(() => communities.id, { onDelete: "cascade" })
      .notNull(),
    businessId: uuid("business_id")
      .references(() => businesses.id, { onDelete: "cascade" })
      .notNull(),
    role: varchar("role", { length: 50 }).default("member").notNull(), // 'member' | 'moderator' | 'admin'
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.communityId, table.businessId] }),
  })
);

export const referralPrograms = pgTable("referral_programs", {
  id: uuid("id").defaultRandom().primaryKey(),
  referrerBusinessId: uuid("referrer_business_id")
    .references(() => businesses.id, { onDelete: "cascade" })
    .notNull(),
  referredBusinessId: uuid("referred_business_id")
    .references(() => businesses.id, { onDelete: "cascade" })
    .notNull(),
  rewardAmount: numeric("reward_amount", { precision: 12, scale: 2 }).notNull(), // Referral credits reward
  status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending' | 'rewarded'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const communitiesRelations = relations(communities, ({ many }) => ({
  members: many(communityMembers),
}));

export const communityMembersRelations = relations(communityMembers, ({ one }) => ({
  community: one(communities, {
    fields: [communityMembers.communityId],
    references: [communities.id],
  }),
  business: one(businesses, {
    fields: [communityMembers.businessId],
    references: [businesses.id],
  }),
}));

export const referralProgramsRelations = relations(referralPrograms, ({ one }) => ({
  referrer: one(businesses, {
    fields: [referralPrograms.referrerBusinessId],
    references: [businesses.id],
    relationName: "referrer_business",
  }),
  referred: one(businesses, {
    fields: [referralPrograms.referredBusinessId],
    references: [businesses.id],
    relationName: "referred_business",
  }),
}));
export const businessesReferralRelations = relations(businesses, ({ many }) => ({
  sentReferrals: many(referralPrograms, { relationName: "referrer_business" }),
  receivedReferrals: many(referralPrograms, { relationName: "referred_business" }),
}));
