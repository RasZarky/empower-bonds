import { pgTable, numeric, varchar, timestamp, text, pgEnum, index, boolean } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { user as users } from './users';
import { budgets, budgetCategory as budgetCategoryTable, budgetCategory } from './budgets'; // Import budgetCategoryTable for proper linking
import { transactions } from './transactions'; // Import transactions to link actual spending records
import { timestamps } from '../helpers/timestamp';
import { bankAccounts } from './bankAccounts';
import { cards } from './cards';

// --- Enums ---
// IMPORTANT: Use the budgetCategoryEnum from the budgets file for consistency.
// Make sure this enum is defined once (e.g., in budgets.ts) and imported here.
// export const budgetCategoryEnum = pgEnum('expenditure_category', [ /* ... */ ]); // Remove if imported

// Renamed for clarity: this defines the *schedule* of a recurring expense
export const recurringScheduleEnum = pgEnum("recurring_schedule", [
    "none", // Changed from "no" for consistency with other enums
    "daily",
    "weekly",
    "bi-weekly", // Added for consistency with loan repayment frequency
    "monthly",
    "quarterly", // Added for consistency
    "annually"   // Changed from "yearly" for consistency
]);

// --- Core `expenditures` Table Definition ---
// This table primarily represents a *planned* or *categorized* expenditure.
// It can represent a single expense or a recurring expense definition.
export const expenditures = pgTable('expenditures', {
    id: text('id').default(sql`gen_random_uuid()`).primaryKey(),

    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    // Link to the specific budget category this expenditure falls under
    // This is crucial for tracking spending against budget categories.
    budgetCategoryId: text('budget_category_id')
        .notNull() // An expenditure should always have a category
        .references(() => budgetCategoryTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }), // Restrict deletion of category if linked expenditures exist

    // If an expenditure is planned for a specific budget period, link to the overall budget
    budgetId: text('budget_id')
        .references(() => budgets.id, { onDelete: 'set null', onUpdate: 'cascade' }), // Can be null if it's an unbudgeted expense

    name: varchar('name', { length: 256 }).notNull(), // e.g., "Electricity Bill", "Netflix Subscription", "Groceries"
    description: varchar('description', { length: 512 }),

    // Expected amount for this expenditure (if it's a recurring definition, this is the expected recurring amount)
    expectedAmount: numeric('expected_amount', { precision: 15, scale: 2 }).notNull(),

    // Fields for recurring expenditures
    isRecurring: boolean('is_recurring').default(false).notNull(),
    recurringSchedule: recurringScheduleEnum('recurring_schedule').default('none').notNull(),

    // When the recurring expenditure is next due (for scheduling)
    nextDueDate: timestamp('next_due_date'),

    // Optional: for fixed recurring payments (e.g., subscriptions)
    autoPayEnabled: boolean('auto_pay_enabled').default(false), // If your system can auto-pay this
    autoPayAccountId: text('auto_pay_account_id').references(() => bankAccounts.id, { onDelete: 'restrict' }),

    // Timestamps
    ...timestamps
}, (table) => [
    index("expenditures_user_id_idx").on(table.userId),
    index("expenditures_budget_id_idx").on(table.budgetId),
    index("expenditures_budget_category_id_idx").on(table.budgetCategoryId)
]);


// --- New Table: `actualExpenditureRecords` ---
// This table tracks *actual instances* of an expenditure, linked to a transaction.
export const actualExpenditureRecords = pgTable('actual_expenditure_records', {
    id: text('id').default(sql`gen_random_uuid()`).primaryKey(),

    // NEW: Foreign Keys for direct linkage to user, account, card, budget, and category
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    accountId: text('account_id')
        .notNull()
        .references(() => bankAccounts.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    cardId: text('card_id')
        .references(() => cards.id, { onDelete: 'set null', onUpdate: 'cascade' }), // Can be null if not card-based
    budgetId: text('budget_id')
        .references(() => budgets.id, { onDelete: 'set null', onUpdate: 'cascade' }), // Can be null if not budget-related
    budgetCategoryId: text('budget_category_id')
        .references(() => budgetCategory.id, { onDelete: 'set null', onUpdate: 'cascade' }), // Can be null if not category-related

    // Link to the main `expenditures` definition (if this is an instance of a planned/recurring one)
    expenditureId: text('expenditure_id')
        .references(() => expenditures.id, { onDelete: 'set null', onUpdate: 'cascade' }), // Can be null for one-off, untracked expenses

    // Link to the actual financial transaction that occurred
    transactionId: text('transaction_id')
        .notNull()
        .unique() // Each transaction record should correspond to one actual expenditure record
        .references(() => transactions.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    // Redundant amount and description, but often useful to store for clarity/reporting
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    description: varchar('description', { length: 512 }),

    // The date the actual expense occurred (from the transaction)
    occurrenceDate: timestamp('occurrence_date').notNull(),

    // Timestamps
    ...timestamps
}, (table) => [
    index("aer_expenditure_id_idx").on(table.expenditureId),
    index("aer_transaction_id_idx").on(table.transactionId),
    // NEW: Add indexes for the new foreign keys
    index("aer_user_id_idx").on(table.userId),
    index("aer_account_id_idx").on(table.accountId),
    index("aer_card_id_idx").on(table.cardId),
    index("aer_budget_id_idx").on(table.budgetId),
    index("aer_budget_category_id_idx").on(table.budgetCategoryId),
]);


// --- Relations ---
export const expendituresRelations = relations(expenditures, ({ one, many }) => ({
    user: one(users, {
        fields: [expenditures.userId],
        references: [users.id],
    }),
    budget: one(budgets, {
        fields: [expenditures.budgetId],
        references: [budgets.id],
    }),
    // An expenditure (definition) belongs to one budget category
    budgetCategory: one(budgetCategoryTable, {
        fields: [expenditures.budgetCategoryId],
        references: [budgetCategoryTable.id],
    }),
    // An expenditure definition can have many actual records (for recurring expenses)
    actualRecords: many(actualExpenditureRecords),
}));

export const actualExpenditureRecordsRelations = relations(actualExpenditureRecords, ({ one }) => ({
    expenditure: one(expenditures, {
        fields: [actualExpenditureRecords.expenditureId],
        references: [expenditures.id],
        relationName: 'actualExpenditure' // Name the relation to avoid conflicts if needed
    }),
    transaction: one(transactions, {
        fields: [actualExpenditureRecords.transactionId],
        references: [transactions.id],
    }),
}));

// --- Drizzle Type Inference ---
export type Expenditure = typeof expenditures.$inferSelect;
export type NewExpenditure = typeof expenditures.$inferInsert;
export type UpdateExpenditure = Partial<NewExpenditure>;

export type ActualExpenditureRecord = typeof actualExpenditureRecords.$inferSelect;
export type NewActualExpenditureRecord = typeof actualExpenditureRecords.$inferInsert;
export type UpdateActualExpenditureRecord = Partial<NewActualExpenditureRecord>;

export type RecurringScheduleEnum = "none" | "daily" | "weekly" | "bi-weekly" | "monthly" | "quarterly" | "annually";