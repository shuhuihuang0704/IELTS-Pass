import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  provider: text("provider", { enum: ["email", "phone", "wechat"] }).notNull(),
  identifier: text("identifier").notNull(),
  passwordHash: text("password_hash"),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  targetBandScore: real("target_band_score"),
  studyPlanDays: integer("study_plan_days"),
  examDate: text("exam_date"),
  progressJson: text("progress_json"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  uniqueIndex("idx_users_provider_identifier").on(table.provider, table.identifier),
]);

export const authSessions = sqliteTable("auth_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  uniqueIndex("idx_auth_sessions_token_hash").on(table.tokenHash),
]);

export const authRecoveryCodes = sqliteTable("auth_recovery_codes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  codeHash: text("code_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp_ms" }),
}, (table) => [
  uniqueIndex("idx_auth_recovery_codes_code_hash").on(table.codeHash),
  index("idx_auth_recovery_codes_user_id").on(table.userId),
]);

export const userProviderIdentities = sqliteTable("user_provider_identities", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  providerUserId: text("provider_user_id").notNull(),
}, (table) => [
  primaryKey({ columns: [table.provider, table.providerUserId] }),
]);
