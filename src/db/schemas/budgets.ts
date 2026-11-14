import { pgTable, numeric, varchar, timestamp, pgEnum, text, index } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { user as users } from './users'; // Import the user schema
import { expenditures } from './expenditures'; // Import expenditures schema
import { timestamps } from '../helpers/timestamp';
import { cards } from './cards';

// Enum for budget frequency
export const budgetFrequencyEnum = pgEnum('budget_frequency', [
    'daily',
    'weekly',
    'bi-weekly',
    'monthly',
    'quarterly',
    'annually'
]);

// Enum for common budget categories (or use varchar if categories are dynamic)
export const budgetCategoryEnum = pgEnum('budget_category_enum', [
    'housing', 'food', 'transportation', 'utilities', 'entertainment',
    'shopping', 'health', 'education', 'savings', 'debt', 'miscellaneous'
]);

export const budgets = pgTable('budgets', {
    id: text('id').default(sql`gen_random_uuid()`).primaryKey(),

    // Foreign Key to users table
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    cardId: text("card_id")
        .notNull()
        .references(() => cards.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    name: varchar('name', { length: 256 }).notNull(), // e.g., "Monthly Groceries Budget"
    budgetAmount: numeric('budget_amount', { precision: 15, scale: 2 }).notNull(),
    actualSpent: numeric('actual_spent', { precision: 15, scale: 2 }).default('0.00').notNull(),

    notes: text("notes"),

    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    frequency: budgetFrequencyEnum('frequency').notNull(),

    // Timestamps
    ...timestamps
}, (table) => [
    index("budget_user_id_idx").on(table.userId),
    index("budget_id_idx").on(table.id),
]);

export const budgetCategory = pgTable("budget_category", {
    id: text('id').default(sql`gen_random_uuid()`).primaryKey(),

    budgetId: text('budget_id')
        .notNull()
        .references(() => budgets.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    category: budgetCategoryEnum('category').notNull(), // Link to an enum or varchar
    amount: numeric('category_amount', { precision: 15, scale: 2 }).default("0.0").notNull(),
    spentAmount: numeric('spent_amount', { precision: 15, scale: 2 }).default('0.00').notNull(),

    // Timestamps
    ...timestamps
})

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
    user: one(users, {
        fields: [budgets.userId],
        references: [users.id],
    }),
    categories: many(budgetCategory),
    expenditures: many(expenditures), // A budget can have many expenditures linked to it
}));

export const budgetCategoryRelations = relations(budgetCategory, ({ one }) => ({
    budget: one(budgets, {
        fields: [budgetCategory.budgetId], // Corrected: This should be budgetId
        references: [budgets.id]
    })
}));

export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;
export type BudgetCategory = typeof budgetCategory.$inferSelect;
export type NewBudgetCategory = typeof budgetCategory.$inferInsert;

export type UpdateBudget = Partial<NewBudget>;
export type BudgetFrequencyEnum = "daily" | "weekly" | "bi-weekly" | "monthly" | "quarterly" | "annually";
export type BudgetCategoryEnum = "housing" | "food" | "transportation" | "utilities" | "entertainment" | "shopping" | "health" | "education" | "savings" | "debt" | "miscellaneous"