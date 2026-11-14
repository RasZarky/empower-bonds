/* eslint-disable import/no-anonymous-default-export */
// Users Schema
import { user, account, passkey, session, verification, socialSecurity, usersRelations } from "./users";

// Preferences & Notification Settings Schema
import { preferences, notificationSettings, notificationSettingsRelations, preferencesRelations } from "./preferences"; // Added notificationSettings

// Bank Accounts Schema
import { bankAccounts, bankAccountsRelations } from "./bankAccounts"; // New import

// Cards Schema
import { cards, cardsRelations } from "./cards";

// Transactions Schema
import { transactions, transactionsRelations } from "./transactions";

// Loans Schema (loanRequests, loanApprovals, loanRepayments)
import { loanRequests, loanApprovals, loanRepayments, loanApprovalsRelations, loanRepaymentsRelations, loanRequestsRelations } from "./loans"; // Added loanRepayments

// Budgets Schema
import { budgets, budgetCategory, budgetCategoryRelations, budgetsRelations } from "./budgets";

// Expenditures Schema (expenditures, actualExpenditureRecords)
import { expenditures, actualExpenditureRecords, actualExpenditureRecordsRelations, expendituresRelations } from "./expenditures"; // Added actualExpenditureRecords


// --- Export schemas via a function ---
/**
 * Returns an object containing all Drizzle ORM table schemas.
 * @returns {object} An object where keys are table names and values are their Drizzle schema definitions.
 */
export default {
    user,
    account,
    socialSecurity,
    passkey,
    verification,
    session,
    preferences,
    notificationSettings, // Exported notificationSettings
    bankAccounts,       // Exported bankAccounts
    cards,
    transactions,
    loanRequests,
    loanApprovals,
    loanRepayments,     // Exported loanRepayments
    budgets,
    budgetCategory,
    expenditures,
    actualExpenditureRecords, // Exported actualExpenditureRecords

    // relationships
    usersRelations,
    notificationSettingsRelations,
    preferencesRelations,
    bankAccountsRelations,
    cardsRelations,
    transactionsRelations,
    loanApprovalsRelations,
    loanRepaymentsRelations,
    loanRequestsRelations,
    budgetCategoryRelations,
    budgetsRelations,
    actualExpenditureRecordsRelations,
    expendituresRelations,
};