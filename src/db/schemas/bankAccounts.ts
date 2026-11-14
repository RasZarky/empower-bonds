import { pgTable, text, varchar, numeric, pgEnum, index, boolean } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { user } from './users'; // Import the user schema
import { transactions } from './transactions'; // Import the transactions schema
import { cards } from './cards'; // Assuming a cards schema will also exist
// NEW: Import the loan tables to establish relations
import { loanApprovals, loanRepayments } from './loans';
import { timestamps } from '../helpers/timestamp';

// Enum for bank account types (e.g., Checking, Savings, Loan)
export const accountTypeEnum = pgEnum('account_type', [
    'checking',
    'savings',
    'loan_account', // To represent a loan as an account for balance tracking
    'credit_card_account', // If you manage credit card balances internally
    'fixed_deposit',
    'investment',
    'current'
]);

// Enum for bank account status
export const accountStatusEnum = pgEnum('account_status', [
    'active',
    'inactive',
    'closed',
    'frozen',
    'suspended',
]);

export const bankAccounts = pgTable('bank_accounts', {
    id: text('id').default(sql`gen_random_uuid()`).primaryKey(), // UUID primary key

    userId: text('user_id')
        .notNull()
        .references(() => user.id, {
            onDelete: 'cascade', // If a user is deleted, their accounts are deleted
            onUpdate: 'cascade'
        }),

    accountNumber: varchar('account_number', { length: 20 }).unique(), // Unique bank account number
    accountType: accountTypeEnum('account_type').notNull(), // e.g., 'checking', 'savings'

    // Current balance of the account
    balance: numeric('balance', { precision: 15, scale: 2 }).default("0.00").notNull(),
    currency: varchar('currency', { length: 3 }).default('USD').notNull(), // e.g., 'USD', 'NGN', 'EUR'

    // Optional fields for real-world banking simulation
    bankName: text('bank_name'), // e.g., "Your Bank PLC"
    branchName: text('branch_name'),
    accountName: text('account_name'), // Display name for the account, e.g., "My Main Checking"

    status: accountStatusEnum('status').default('active').notNull(), // Current status of the account
    isPrimary: boolean('is_primary').default(false), // Designate a primary account for the user

    // Timestamps
    ...timestamps
}, (table) => [
    index("bank_account_user_id_idx").on(table.userId),
    index("bank_account_number_idx").on(table.accountNumber),
    index("bank_account_id_idx").on(table.id),
]);

// --- Refactored Relations for the bankAccounts table ---
export const bankAccountsRelations = relations(bankAccounts, ({ one, many }) => ({
    // An account belongs to one user
    user: one(user, {
        fields: [bankAccounts.userId],
        references: [user.id],
    }),
    // An account can have many transactions
    transactions: many(transactions),
    // An account can have many cards
    cards: many(cards),

    // NEW: Relationships with loan tables
    // 1. An account can be the disbursement account for many loan approvals
    disbursedLoans: many(loanApprovals, { relationName: 'disbursementAccount' }),

    // 2. An account can be the special 'loan_account' for tracking many specific loans
    trackedLoans: many(loanApprovals, { relationName: 'loanTrackingAccount' }),

    // 3. An account can be the source account for many loan repayments
    loanRepaymentsMade: many(loanRepayments, { relationName: 'repaymentSourceAccount' }),
}));

// --- Drizzle Type Inference ---
export type BankAccount = typeof bankAccounts.$inferSelect;
export type NewBankAccount = typeof bankAccounts.$inferInsert;
export type UpdateBankAccount = Partial<NewBankAccount>;
export type AccountTypeEnum = "checking" | "savings" | "loan_account" | "credit_card_account" | "fixed_deposit" | "investment" | "current";
export type AccountStatusEnum = "active" | "inactive" | "closed" | "frozen" | "suspended";