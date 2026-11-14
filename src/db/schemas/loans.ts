import { pgTable, numeric, text, pgEnum, timestamp, index } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { User, user as users } from './users';
import { bankAccounts } from './bankAccounts'; // Import the bankAccounts schema
import { transactions } from './transactions'; // Import transactions for linking disbursements/repayments
import { timestamps } from '../helpers/timestamp';

// Enums (kept as is, they are good)
export const loanRequestStatusEnum = pgEnum('loan_request_status', [
    'pending',
    'approved',
    'rejected',
    'cancelled',
    'disbursed',
    'completed'
]);

export const repaymentFrequencyEnum = pgEnum('repayment_frequency', [
    'daily',
    'weekly',
    'bi-weekly',
    'monthly',
    'quarterly',
    'annually'
]);

// --- loanRequests Table Definition (Minimal Changes) ---
export const loanRequests = pgTable('loan_requests', {
    id: text('id').default(sql`gen_random_uuid()`).primaryKey(),

    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    amountRequested: numeric('amount_requested', { precision: 15, scale: 2 }).notNull(),
    purpose: text('purpose').notNull(),

    tenureMonths: numeric('tenure_months', { precision: 3, scale: 0 }).notNull(),
    repaymentFrequency: repaymentFrequencyEnum('repayment_frequency').notNull(),

    status: loanRequestStatusEnum('status').default('pending').notNull(), // Status of the request itself

    // Timestamps
    ...timestamps
}, (table) => [
    index("loan_request_user_id_idx").on(table.userId)
]);


export const loanApprovals = pgTable('loan_approvals', {
    id: text('id').default(sql`gen_random_uuid()`).primaryKey(),

    loanRequestId: text('loan_request_id')
        .notNull()
        .unique()
        .references(() => loanRequests.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    approvedAmount: numeric('approved_amount', { precision: 15, scale: 2 }).notNull(),
    interestRate: numeric('interest_rate', { precision: 5, scale: 2 }).notNull(), // e.g., 15.50 for 15.50%
    repaymentStartDate: timestamp('repayment_start_date').notNull(),

    // NEW: Link to the bank account where the loan was disbursed (e.g., user's checking account)
    disbursementAccountId: text('disbursement_account_id')
        .notNull()
        .references(() => bankAccounts.id, { onDelete: 'restrict', onUpdate: 'cascade' }),

    // NEW: Link to the transaction record of the loan disbursement
    disbursementTransactionId: text('disbursement_transaction_id')
        .unique() // One disbursement transaction per loan approval
        .references(() => transactions.id, { onDelete: 'restrict', onUpdate: 'cascade' }),

    // NEW: The actual loan account used for tracking the principal, interest, and payments
    // This will be a 'loan_account' type in the bankAccounts table
    loanAccountId: text('loan_account_id')
        .unique() // Each approved loan gets its own tracking account
        .references(() => bankAccounts.id, { onDelete: 'restrict', onUpdate: 'cascade' }),

    // NEW: Current outstanding principal balance (this can be tracked here or derived from loanAccountId balance)
    // It's often helpful to store this directly for quick access and to manage principal vs interest separately.
    outstandingPrincipal: numeric('outstanding_principal', { precision: 15, scale: 2 }).notNull(),

    // Total amount to be repaid including interest
    totalRepayableAmount: numeric('total_repayable_amount', { precision: 15, scale: 2 }).notNull(),

    approvedByUserId: text('approved_by_user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'restrict', onUpdate: 'cascade' }),

    termsAndConditions: text('terms_and_conditions').default(""),

    // Timestamps
    ...timestamps
}, (table) => [
    index("loan_approvals_request_id_idx").on(table.loanRequestId),
    index("loan_approvals_approved_by_idx").on(table.approvedByUserId),
    index("loan_approvals_disbursement_account_id_idx").on(table.disbursementAccountId),
    index("loan_approvals_loan_account_id_idx").on(table.loanAccountId),
]);


// --- New Table: loanRepayments (to track individual repayments) ---
export const loanRepayments = pgTable('loan_repayments', {
    id: text('id').default(sql`gen_random_uuid()`).primaryKey(),

    // NEW: Direct link to the user who made the repayment
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }), // Or restrict, depending on policy

    // Link to the specific loan approval this repayment is for
    loanApprovalId: text('loan_approval_id')
        .notNull()
        .references(() => loanApprovals.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    // Link to the bank account from which the repayment was made (e.g., user's checking)
    repaymentSourceAccountId: text('repayment_source_account_id')
        .notNull()
        .references(() => bankAccounts.id, { onDelete: 'restrict', onUpdate: 'cascade' }),

    // Link to the transaction record of this repayment
    repaymentTransactionId: text('repayment_transaction_id')
        .unique() // Each repayment transaction is unique
        .references(() => transactions.id, { onDelete: 'restrict', onUpdate: 'cascade' }),

    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(), // Amount of this specific repayment

    // Optional: breakdown of principal and interest in this repayment
    principalPaid: numeric('principal_paid', { precision: 15, scale: 2 }).notNull(),
    interestPaid: numeric('interest_paid', { precision: 15, scale: 2 }).notNull(),

    repaymentDate: timestamp('repayment_date').defaultNow().notNull(),

    // Timestamps
    ...timestamps
}, (table) => [
    index("loan_repayments_loan_approval_id_idx").on(table.loanApprovalId),
    index("loan_repayments_source_account_id_idx").on(table.repaymentSourceAccountId),
    index("loan_repayments_transaction_id_idx").on(table.repaymentTransactionId),
]);


// --- Relations for the loan tables ---
export const loanRequestsRelations = relations(loanRequests, ({ one }) => ({
    user: one(users, {
        fields: [loanRequests.userId],
        references: [users.id],
    }),
    approval: one(loanApprovals),
}));

export const loanApprovalsRelations = relations(loanApprovals, ({ one, many }) => ({
    loanRequest: one(loanRequests, {
        fields: [loanApprovals.loanRequestId],
        references: [loanRequests.id],
    }),
    approver: one(users, {
        fields: [loanApprovals.approvedByUserId],
        references: [users.id],
        relationName: 'approver'
    }),
    // The account to which the loan was disbursed
    disbursementAccount: one(bankAccounts, {
        fields: [loanApprovals.disbursementAccountId],
        references: [bankAccounts.id],
        relationName: 'disbursementAccount'
    }),
    // The special loan account for tracking
    loanAccount: one(bankAccounts, {
        fields: [loanApprovals.loanAccountId],
        references: [bankAccounts.id],
        relationName: 'loanTrackingAccount'
    }),
    // The transaction for disbursement
    disbursementTransaction: one(transactions, {
        fields: [loanApprovals.disbursementTransactionId],
        references: [transactions.id],
        relationName: 'disbursementTransaction'
    }),
    // Many repayments for this approved loan
    repayments: many(loanRepayments),
}));

export const loanRepaymentsRelations = relations(loanRepayments, ({ one }) => ({
    loanApproval: one(loanApprovals, {
        fields: [loanRepayments.loanApprovalId],
        references: [loanApprovals.id],
    }),
    user: one(users, {
        fields: [loanRepayments.userId],
        references: [users.id],
    }),
    sourceAccount: one(bankAccounts, {
        fields: [loanRepayments.repaymentSourceAccountId],
        references: [bankAccounts.id],
        relationName: 'repaymentSourceAccount'
    }),
    repaymentTransaction: one(transactions, {
        fields: [loanRepayments.repaymentTransactionId],
        references: [transactions.id],
        relationName: 'repaymentTransaction'
    })
}));

// --- Drizzle Type Inference ---
export type LoanRequestStatusEnum = "pending" | "approved" | "rejected" | "cancelled" | "disbursed" | "completed";
export type RepaymentFrequencyEnum = "daily" | "weekly" | "bi-weekly" | "monthly" | "quarterly" | "annually";
export type LoanRequest = typeof loanRequests.$inferSelect;
export type NewLoanRequest = typeof loanRequests.$inferInsert;
export type UpdateLoanRequest = Partial<NewLoanRequest>; // Added for consistency

export type LoanApproval = typeof loanApprovals.$inferSelect;
export type NewLoanApproval = typeof loanApprovals.$inferInsert;
export type UpdateLoanApproval = Partial<NewLoanApproval>; // Added for consistency

export type LoanRepayment = typeof loanRepayments.$inferSelect;
export type NewLoanRepayment = typeof loanRepayments.$inferInsert;
export type UpdateLoanRepayment = Partial<NewLoanRepayment>; // Added for consistencya
export interface LoanrequestWithRelationships extends LoanRequest {
    user: User;
    approval: LoanApproval | null;
} 