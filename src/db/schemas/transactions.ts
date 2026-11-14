import { pgTable, numeric, pgEnum, index, text } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { user } from './users';
import { bankAccounts } from './bankAccounts'; // Make sure this import is present
import { timestamps } from '../helpers/timestamp';

// --- Enums for Transactions ---
export const transactionTypeEnum = pgEnum('transaction_type', [
    'deposit',
    'withdrawal',
    'purchase',
    'sale',
    'fee',
    'transfer',
]);

export const transactionStatusEnum = pgEnum('transaction_status', [
    'pending',
    'completed',
    'failed',
    'cancelled',
    'refunded',
]);

// --- Transactions Table Definition ---
export const transactions = pgTable('transactions', {
    id: text('id').default(sql`gen_random_uuid()`).primaryKey(),

    userId: text('user_id')
        .notNull()
        .references(() => user.id, {
            onDelete: 'cascade',
            onUpdate: 'cascade'
        }),

    // NEW: Link to the bank account involved in the transaction
    accountId: text('account_id')
        .notNull() // A transaction must be associated with an account
        .references(() => bankAccounts.id, {
            onDelete: 'cascade', // Delete transactions if the account is deleted
            onUpdate: 'cascade'
        }),

    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    type: transactionTypeEnum('type').notNull(),
    status: transactionStatusEnum('status').default('pending').notNull(),

    description: text('description'),
    transactionRef: text('transaction_ref').unique(),

    ...timestamps
}, (table) => [
    index("transaction_id_idx").on(table.id),
    index("transaction_user_id_idx").on(table.userId),
    index("transaction_account_id_idx").on(table.accountId) // New index for accountId
]);

// --- Relations for the transactions table ---
export const transactionsRelations = relations(transactions, ({ one }) => ({
    user: one(user, {
        fields: [transactions.userId],
        references: [user.id],
    }),
    account: one(bankAccounts, { // Add this relation
        fields: [transactions.accountId],
        references: [bankAccounts.id],
    }),
}));

// --- Drizzle Type Inference ---
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type UpdateTransactions = Partial<NewTransaction>
export type TransactionTypeEnum = "deposit" | "withdrawal" | "purchase" | "sale" | "fee" | "transfer";
export type TransactionStatusEnum = "pending" | "completed" | "failed" | "cancelled" | "refunded";