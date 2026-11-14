import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import schemas from "@/db/schemas"
import { Preference } from "./db";

// --- User & Auth Schemas ---
export type {
    User,
    AddUser,
    UpdateUser,
    Account,
    Verification,
    Session,
    Passkey,
    AddPasskey,
    UpdatePasskey,
    SocialSecurity, // Added NewSocialSecurity, UpdateSocialSecurity
    NewSocialSecurity,
    UpdateSocialSecurity,
} from "@/db/schemas/users";

// --- Preferences & Notification Settings Schemas ---
export type {
    Preference,
    NewPreference,
    UpdatePreference,
    ThemeEnum, // Added from preferences schema refactor
    LanguageEnum, // Added from preferences schema refactor
    CurrencyDisplayFormatEnum, // Added from preferences schema refactor
    NotificationSetting, // New table from preferences refactor
    NewNotificationSetting, // New table from preferences refactor
    UpdateNotificationSetting, // New table from preferences refactor
    NotificationChannelsEnum, // New enum from preferences refactor
    NotificationTypeEnum, // New enum from preferences refactor
} from "@/db/schemas/preferences";

// --- Bank Accounts Schemas ---
export type {
    BankAccount, // New
    NewBankAccount, // New
    UpdateBankAccount, // New
    AccountTypeEnum, // New
    AccountStatusEnum, // New
} from "@/db/schemas/bankAccounts";

// --- Cards Schemas ---
export type {
    Card,
    NewCard,
    UpdateCard,
    CardBrandEnum, // Renamed from CardEnum
    CardClassEnum, // New
    CardStatusEnum, // New
} from "@/db/schemas/cards";

// --- Transactions Schemas ---
export type {
    Transaction,
    NewTransaction,
    UpdateTransactions,
    TransactionStatusEnum,
    TransactionTypeEnum,
} from "@/db/schemas/transactions";

// --- Loans Schemas ---
export type {
    LoanRequest,
    NewLoanRequest,
    UpdateLoanRequest, // Added
    LoanRequestStatusEnum,
    RepaymentFrequencyEnum,
    LoanApproval,
    NewLoanApproval,
    UpdateLoanApproval, // Added
    LoanRepayment, // New table
    NewLoanRepayment, // New table
    UpdateLoanRepayment, // New table
} from "@/db/schemas/loans";

// --- Budgets Schemas ---
export type {
    Budget,
    NewBudget,
    UpdateBudget,
    BudgetCategory,
    NewBudgetCategory,
    BudgetFrequencyEnum,
    BudgetCategoryEnum,
} from "@/db/schemas/budgets";

// --- Expenditures Schemas ---
export type {
    Expenditure,
    NewExpenditure,
    UpdateExpenditure,
    RecurringScheduleEnum, // Renamed from ExpenditureRecurringEnum
    ActualExpenditureRecord, // New table
    NewActualExpenditureRecord, // New table
    UpdateActualExpenditureRecord, // New table
} from "@/db/schemas/expenditures";


// --- Composite Types ---

/**
 * Represents a Budget with its associated categories.
 */
export interface BudgetWithCategories {
    budget: Budget;
    categories: BudgetCategory[]; // Corrected typo: BudgetCatgory -> BudgetCategory
}

// --- Database Connection Type ---

/**
 * Represents the Drizzle ORM database connection type, including all defined schemas.
 */
export type DBType = PostgresJsDatabase<typeof schemas>;

// --- API Result Types (for queries and mutations) ---

/**
 * Represents a generic action result, indicating success or failure.
 * @template T - The type of data returned on success.
 */
export interface ActionResult<T> {
    success: boolean;
    data?: T;
    error?: string; // Standardized error message
    message?: string; // General informational message
    // Optionally add a code for specific error handling (e.g., 'NOT_FOUND', 'UNAUTHORIZED')
    code?: string;
}

// --- New Type for Enriched Loan Request ---
// This type extends the base LoanRequest with computed properties for the table.
export type EnrichedLoanRequest = LoanRequest & {
    approvedAmount: number | null;
    paidAmount: number | null;
    remainingAmount: number | null;
    progressPercentage: number | null;
    isOverdue: boolean | null;
    repaymentEndDate: Date | null; // Added for display/filtering
};

/**
 * Represents a paginated result set with metadata, typically used for lists of items.
 * @template T - The type of items in the data array.
 */
export type PaginatedResult<T> = {
    success: boolean; // Indicates if the pagination query was successful
    /** Array of paginated items for the current page */
    data: T[];
    /** Number of items requested per page */
    pageSize: number;
    /** The cursor value to use for fetching the next page (null if no more pages) */
    nextCursor: string | Date | number | null | undefined;
    /** Whether there are more pages available after the current one */
    hasNextPage: boolean;
};

/**
 * Input type for cursor-based pagination queries.
 */
export type CursorPaginationInput = {
    /** The maximum number of items to return per page. */
    pageSize?: number;
    /** The cursor value from which to start fetching the next page. */
    cursor?: string | Date | number | null; // e.g., 'createdAt' timestamp or primary key
};

// --- Specific Update Types ---
export type UpdateCardStatusType = {
    // These fields are specific to the card status and are now part of the `CardStatusEnum`
    // Consider using `UpdateCard` partial type directly if `status` field is being updated.
    // If these are specific actions, they might be better represented as function parameters.
    // For now, keeping it as is, but noting potential refactor.
    status?: CardStatusEnum; // Changed to use the new CardStatusEnum
};

// --- Data Structures for Profile Page (Redefined for clarity and completeness) ---
export interface UserProfileData {
    id: string;
    email: string;
    name: string | null;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
    preferences: Preference | null;
    hashedTransactionPin: string | null;
    bankAccounts: {
        id: string;
        accountName: string | null;
        accountNumber: string | null;
    }[];
    lastLogin: Date | null;
}

// --- Combined Data Type for Settings Page Initial Fetch ---
export interface SettingsPageData {
    notificationSettings: NotificationSetting[];
    socialSecurity: SocialSecurity | null;
    passkeys: Passkey[];
    activeSessions: Session[];
}