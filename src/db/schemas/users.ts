import { index, varchar } from "drizzle-orm/pg-core";
import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { transactions } from "./transactions";
import { sql } from "drizzle-orm/sql";
import { preferences } from "./preferences";
import { cards } from "./cards";
import { loanApprovals, loanRepayments, loanRequests } from "./loans";
import { budgets } from "./budgets";
import { expenditures } from "./expenditures";
import { bankAccounts } from "./bankAccounts";

export const user = pgTable("user", {
    id: text('id').default(sql`gen_random_uuid()`).primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').$defaultFn(() => false).notNull(),
    image: text('image'),
    blocked: boolean("blocked").default(false),
    twoFactorEnabled: boolean("twoFactorEnabled").default(false),
    admin: boolean("admin").default(false),
    hashedTransactionPin: text('hashed_transaction_pin'),
    createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
    updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
    index("user_email_idx").on(table.email)
]);

export const session = pgTable("session", {
    id: text('id').default(sql`gen_random_uuid()`).primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' })
}, (table) => [
    index("session_user_id_idx").on(table.userId),
    index("session_token_idx").on(table.token),
]);

export const account = pgTable("account", {
    id: text('id').default(sql`gen_random_uuid()`).primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull()
}, (table) => [
    index("account_user_id_idx").on(table.userId)
]);

export const verification = pgTable("verification", {
    id: text('id').default(sql`gen_random_uuid()`).primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()),
    updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date())
}, (table) => [
    index("verification_identifier_idx").on(table.identifier)
]);

export const passkey = pgTable("passkey", {
    id: text('id').default(sql`gen_random_uuid()`).primaryKey(),
    name: text('name'),
    publicKey: text('public_key').notNull(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    credentialID: text('credential_i_d').notNull(),
    counter: integer('counter').notNull(),
    deviceType: text('device_type').notNull(),
    backedUp: boolean('backed_up').notNull(),
    transports: text('transports'),
    createdAt: timestamp('created_at'),
    aaguid: text('aaguid')
}, (table) => [
    index("passkey_user_id_idx").on(table.userId)
]);

export const socialSecurity = pgTable("social_security", {
    id: text('id').default(sql`gen_random_uuid()`).primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    legalName: varchar("legal_name", { length: 256 }).notNull(),
    socialSecurityNumber: varchar("social_security_number", { length: 12 }).notNull(),
    dateOfBirth: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()),
    verified: boolean("verified").default(false),
    createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()),
    updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date())
})


// Define relations for the users table
export const usersRelations = relations(user, ({ one, many }) => ({
    // One-to-one relation with preferences (a user has one preference profile)
    preferences: one(preferences),

    // One-to-many relations
    cards: many(cards),
    budgets: many(budgets),
    expenditures: many(expenditures),
    transactions: many(transactions),

    // NEW: User can have many bank accounts
    bankAccounts: many(bankAccounts),

    // Loan-related relations:
    // A user can make many loan requests
    loanRequests: many(loanRequests),

    // A user can be the approver for many loan approvals
    approvedLoans: many(loanApprovals, { relationName: 'approver' }),

    // NEW: A user can be associated with many loan approvals for which they are the borrower
    // (This relationship exists implicitly via loanRequests, but explicit is good for Drizzle if querying from user)
    // You might consider adding a direct userId to loanApprovals if you want to query borrower-approved loans directly.
    // However, since loanRequests already links to user, and loanApprovals links to loanRequests, this is less direct
    // A more direct way to query approved loans *for* a user would be through their loanRequests.
    // For now, let's skip adding a direct relation here unless specifically needed for complex queries.

    // NEW: A user can have many loan repayments
    loanRepayments: many(loanRepayments),
}));


export type User = typeof user.$inferSelect
export type AddUser = typeof user.$inferInsert
export type UpdateUser = Partial<AddUser>
export type SocialSecurity = typeof socialSecurity.$inferSelect
export type NewSocialSecurity = typeof socialSecurity.$inferInsert
export type UpdateSocialSecurity = Partial<SocialSecurity>
export type Session = typeof session.$inferSelect
export type Account = typeof account.$inferSelect
export type Verification = typeof verification.$inferSelect
export type Passkey = typeof passkey.$inferSelect
export type AddPasskey = typeof passkey.$inferInsert
export type UpdatePasskey = Partial<AddPasskey>