import { pgTable, varchar, text, index, boolean, numeric, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { user as users } from './users';
import { bankAccounts } from './bankAccounts'; // Import bankAccounts for default_account_id
import { timestamps } from '../helpers/timestamp';

// --- Enums for common preference options ---
export const themeEnum = pgEnum('theme_options', ['light', 'dark', 'system']);
export const languageEnum = pgEnum('language_options', ['en', 'es', 'fr', 'de', 'pt', 'ko', 'zh', 'ar']); // Expanded common languages
export const currencyDisplayFormatEnum = pgEnum('currency_display_format', ['symbol_before', 'symbol_after', 'code_before', 'code_after']); // e.g., $100 vs 100$ vs USD 100 vs 100 USD

// --- Preferences Table Definition ---
export const preferences = pgTable('preferences', {
    id: text('id').default(sql`gen_random_uuid()`).primaryKey(),

    userId: text('user_id')
        .notNull()
        .unique() // Enforces a 1-to-1 relationship
        .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    // General Display & Locale Settings
    currency: varchar('currency', { length: 5 }).default('USD').notNull(), // User's preferred display currency (e.g., 'NGN', 'USD')
    currencyDisplayFormat: currencyDisplayFormatEnum('currency_display_format').default('symbol_before').notNull(),
    language: languageEnum('language').default('en').notNull(),
    timezone: varchar('timezone', { length: 64 }).default('America/New_York').notNull(), // e.g., 'America/New_York', 'UTC' (important for financial operations)
    theme: themeEnum('theme').default('system').notNull(), // 'light', 'dark', 'system'

    // Account & Transaction Defaults
    // NEW: Default bank account for deposits/withdrawals/primary view
    defaultAccountId: text('default_account_id')
        .references(() => bankAccounts.id, { onDelete: 'set null', onUpdate: 'cascade' }), // Set to null if default account is deleted

    // NEW: Whether to display balances on dashboard/widgets by default
    hideBalances: boolean('hide_balances').default(false).notNull(),

    // NEW: Default preference for showing transaction descriptions or merchant names
    // This could be a text field or another enum if specific options are needed
    transactionDisplayPreference: varchar('transaction_display_preference', { length: 50 }).default('merchant_name'),


    // Budgeting Preferences
    // NEW: How user wants to be notified about budget thresholds
    budgetAlertThreshold: numeric('budget_alert_threshold', { precision: 5, scale: 2 }).default("80.00").notNull(), // e.g., alert when 80% of budget is spent
    budgetAlertFrequency: varchar('budget_alert_frequency', { length: 50 }).default('daily'), // e.g., 'daily', 'weekly', 'instant'

    // Communication Preferences (extracted into a separate table below, but placeholder if kept here)
    // Removed specific `notifications` and `notificationSettings` jsonb columns
    // They are better managed in a dedicated `notificationSettings` table for granular control.

    // Security Preferences (beyond authentication methods in `passkey` table)
    // NEW: Require biometric or PIN for sensitive actions (e.g., transfers, adding beneficiaries)
    requireBiometricForSensitiveActions: boolean('require_biometric_for_sensitive_actions').default(false).notNull(),

    // Timestamps
    ...timestamps
}, (table) => [
    index("preference_user_id_idx").on(table.userId),
    index("preference_default_account_id_idx").on(table.defaultAccountId),
]);

// --- Relations for the preferences table ---
export const preferencesRelations = relations(preferences, ({ one }) => ({
    user: one(users, {
        fields: [preferences.userId],
        references: [users.id],
    }),
    // NEW: A preference can point to one default bank account
    defaultAccount: one(bankAccounts, {
        fields: [preferences.defaultAccountId],
        references: [bankAccounts.id],
    }),
}));

// --- Drizzle Type Inference ---
export type Preference = typeof preferences.$inferSelect;
export type NewPreference = typeof preferences.$inferInsert;
export type UpdatePreference = Partial<NewPreference>;
export type ThemeEnum = typeof themeEnum;
export type LanguageEnum = typeof languageEnum;
export type CurrencyDisplayFormatEnum = typeof currencyDisplayFormatEnum;


// --- Recommendation: Separate Notification Settings Table ---
// While you had JSONB for notifications, a dedicated table offers more flexibility,
// easier querying, and clearer structure, especially with different channels (email, SMS, push).

export const notificationChannelsEnum = pgEnum('notification_channel', ['email', 'sms', 'push_notification', 'in_app']);
export const notificationTypeEnum = pgEnum('notification_type', [
    'transaction_alert',
    'deposit_notification',
    'withdrawal_notification',
    'bill_reminder',
    'loan_due_date',
    'loan_repayment_confirmation',
    'budget_threshold_alert',
    'card_activity_alert',
    'marketing_promotion',
    'security_alert',
    // Add more granular types as needed
]);

export const notificationSettings = pgTable('notification_settings', {
    id: text('id').default(sql`gen_random_uuid()`).primaryKey(),

    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    notificationType: notificationTypeEnum('notification_type').notNull(),
    channel: notificationChannelsEnum('channel').notNull(),
    enabled: boolean('enabled').default(true).notNull(), // Is this specific notification type via this channel enabled?

    // Optional: Thresholds for this specific notification type (e.g., only notify for transactions over $100)
    thresholdAmount: numeric('threshold_amount', { precision: 15, scale: 2 }),

    // Optional: How often for this specific notification type
    frequency: varchar('frequency', { length: 50 }), // e.g., 'instant', 'daily_digest', 'weekly_summary'

    // Timestamps
    ...timestamps
}, (table) => [
    index("notification_settings_user_id_idx").on(table.userId),
    index("notification_settings_type_channel_idx").on(table.notificationType, table.channel), // Compound index
    uniqueIndex("notification_settings_user_type_channel_unique_idx").on(table.userId, table.notificationType, table.channel), // Ensures unique setting per user for each type+channel combination
]);

export const notificationSettingsRelations = relations(notificationSettings, ({ one }) => ({
    user: one(users, {
        fields: [notificationSettings.userId],
        references: [users.id],
    }),
}));

export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type NewNotificationSetting = typeof notificationSettings.$inferInsert;
export type UpdateNotificationSetting = Partial<NewNotificationSetting>;
export type NotificationChannelsEnum = "email" | "sms" | "push_notification" | "in_app";
export type NotificationTypeEnum = "transaction_alert" | "deposit_notification" | "withdrawal_notification" | "bill_reminder" | "loan_due_date" | "loan_repayment_confirmation" | "budget_threshold_alert" | "card_activity_alert" | "marketing_promotion" | "security_alert";