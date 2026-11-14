import { pgTable, varchar, boolean, pgEnum, index, text } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { user as users } from './users';
import { bankAccounts } from './bankAccounts'; // Import bankAccounts
import { timestamps } from '../helpers/timestamp';

// Enum for card brands
export const cardBrandEnum = pgEnum('card_brand', ['visa', 'mastercard', 'verve', 'amex', 'discover', 'jcb']); // Added more common brands

// Enum for card class (Debit, Credit, Prepaid)
export const cardClassEnum = pgEnum('card_class', ['debit', 'credit', 'prepaid', 'virtual']); // Added 'virtual'

// Enum for card status (Active, Blocked, Lost, Stolen, Expired, Suspended)
export const cardStatusEnum = pgEnum('card_status', [
    'active',
    'blocked',
    'lost',
    'stolen',
    'expired',
    'suspended',
    'issued' // Card has been created but not yet active
]);

export const cards = pgTable('cards', {
    id: text('id').default(sql`gen_random_uuid()`).primaryKey(),

    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    // NEW: Link to the bank account this card draws funds from or is associated with
    accountId: text('account_id')
        .notNull() // A card must be linked to an account
        .references(() => bankAccounts.id, { onDelete: 'restrict', onUpdate: 'cascade' }), // Don't delete account if cards exist
    cardNumber: varchar('card_number', { length: 16 }).notNull().unique(),

    // PCI DSS Compliant Storage: ONLY last four digits or a token from a payment processor
    // For a real banking solution, you'd store a token from your payment processor here.
    // If only tracking locally, lastFourDigits is sufficient.
    lastFourDigits: varchar('last_four_digits', { length: 4 }).notNull(),
    token: varchar('token', { length: 256 }).unique(), // If using a tokenization service

    cardBrand: cardBrandEnum('card_brand').notNull(), // e.g., 'visa', 'mastercard'
    cardClass: cardClassEnum('card_class').default('debit').notNull(), // e.g., 'debit', 'credit', 'prepaid'

    // Note: Expiry dates are often stored encrypted or via a token.
    // For this schema, assuming it's linked to a payment processor that handles the real expiry.
    expiryMonth: varchar('expiry_month', { length: 2 }), // e.g., '01'
    expiryYear: varchar('expiry_year', { length: 4 }),   // e.g., '2028'

    cardHolderName: varchar('card_holder_name', { length: 256 }).notNull(), // Must be explicit

    // Status of the card itself (active, blocked, lost, etc.)
    status: cardStatusEnum('status').default('issued').notNull(),

    // Flags
    isDefault: boolean('is_default').default(false).notNull(),

    // No 'isExpired' column needed, can be derived from expiry dates
    // No 'currentBalance' column for debit/prepaid cards, balance is on bankAccount
    // If 'credit' card, its balance would be on the linked bankAccount (type 'credit_card_account')

    // Optional: for virtual cards
    isVirtual: boolean('is_virtual').default(false).notNull(),

    // Timestamps
    ...timestamps
}, (table) => [
    index('card_user_id_idx').on(table.userId),
    index('card_account_id_idx').on(table.accountId),
    index('card_token_idx').on(table.token), // Index for faster token lookups
]);

export const cardsRelations = relations(cards, ({ one }) => ({
    user: one(users, {
        fields: [cards.userId],
        references: [users.id],
    }),
    // A card is associated with one bank account
    bankAccount: one(bankAccounts, {
        fields: [cards.accountId],
        references: [bankAccounts.id],
    }),
}));

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
export type UpdateCard = Partial<NewCard>;
export type CardBrandEnum = "visa" | "mastercard" | "verve" | "amex" | "discover" | "jcb"; // Renamed from CardEnum
export type CardClassEnum = "debit" | "credit" | "prepaid" | "virtual";
export type CardStatusEnum = "active" | "blocked" | "lost" | "stolen" | "expired" | "suspended" | "issued";