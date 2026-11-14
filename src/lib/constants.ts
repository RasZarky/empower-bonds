// src/constants/notificationDefaults.ts (or integrated into your preferences schema file)

import config from "@/config";
import { DB } from "@/db";
import schemas from "@/db/schemas";
import { NotificationTypeEnum, NotificationChannelsEnum, AccountTypeEnum } from "@/types/db";
import { eq } from "drizzle-orm";

// Define the structure of a default notification setting entry
interface DefaultNotificationConfig {
    type: NotificationTypeEnum;
    channel: NotificationChannelsEnum;
    enabled: boolean;
    // Add other optional fields like thresholdAmount or frequency if you want defaults for them
    // thresholdAmount?: number;
    // frequency?: string;
}

// In your actions file or a separate constants/utils file
// Pre-defined values for account number generation
const BANK_CODE = '082'; // Example Nigerian bank code (e.g., for UBA) - 3 digits
// You might also have a BRANCH_CODE if your system uses branches and needs it in the number.
// For simplicity and common 10-digit Nigerian accounts, we'll combine with account type and a unique suffix.

// Mapping for internal account types to a short numeric code to be embedded in the account number
const ACCOUNT_TYPE_CODES: Record<AccountTypeEnum, string> = {
    'checking': '10',         // 2 digits
    'savings': '20',          // 2 digits
    'loan_account': '30',     // 2 digits
    'credit_card_account': '40',      // 2 digits (though credit cards have different numbering schemes, for internal consistency)
    'fixed_deposit': '50',
    'investment': '60',
    'current': '70',
};

/**
 * Generates a plausible and unique bank account number based on predefined values.
 * Format Example (10 digits): [BANK_CODE (3 digits)][ACCOUNT_TYPE_CODE (2 digits)][UNIQUE_SUFFIX (5 digits)]
 * E.g., '0821012345' for a checking account at a bank with code '082'.
 *
 * Includes a uniqueness check against existing numbers in the database.
 *
 * @param {BankAccountTypeEnum} accountType The type of bank account (e.g., 'checking', 'savings').
 * @returns {Promise<string>} A unique, auto-generated 10-digit bank account number.
 * @throws {Error} If a unique number cannot be generated after multiple attempts.
 */
export async function generateBankAccountNumber(accountType: AccountTypeEnum): Promise<string> {
    const maxAttempts = 10; // Max attempts to generate a unique number before giving up
    let attempt = 0;

    const accountTypeCode = ACCOUNT_TYPE_CODES[accountType];
    if (!accountTypeCode) {
        throw new Error(`Unsupported account type for auto-generation: ${accountType}. Please add it to ACCOUNT_TYPE_CODES.`);
    }

    while (attempt < maxAttempts) {
        // Generate a 5-digit unique suffix for entropy and uniqueness.
        // Using `Date.now()` (milliseconds) and `Math.random()` provides good randomness.
        // `% 100000` ensures it's within a 5-digit range, and `padStart(5, '0')` ensures leading zeros if needed.
        const uniqueSuffix = (Math.floor(Date.now() / 100) + Math.floor(Math.random() * 10000)).toString().slice(-5).padStart(5, '0');

        // Assemble the candidate account number
        const candidateNumber = `${BANK_CODE}${accountTypeCode}${uniqueSuffix}`; // This will be 3+2+5 = 10 digits

        // --- Crucial Step: Check for uniqueness in the database ---
        const existingAccount = await DB.query.bankAccounts.findFirst({
            where: eq(schemas.bankAccounts.accountNumber, candidateNumber),
            columns: { id: true } // We only need to know if it exists, no need to fetch full data
        });

        if (!existingAccount) {
            // Found a unique number!
            return candidateNumber;
        }

        if (config.NODE_ENV !== "production") {
            console.warn(`Generated duplicate account number: ${candidateNumber}. Retrying... (Attempt ${attempt + 1}/${maxAttempts})`)
        };
        attempt++;
    }

    // If we exhaust attempts without finding a unique number
    throw new Error('Failed to generate a unique bank account number after multiple attempts. This might indicate a high collision rate or a need to adjust the generation logic/suffix length.');
}

/**
 * An array containing the default notification settings for new users.
 * Each entry specifies a notification type, channel, and its default enabled state.
 */
export const DEFAULT_NOTIFICATION_SETTINGS: DefaultNotificationConfig[] = [
    // Transaction Alerts
    { type: 'transaction_alert', channel: 'email', enabled: true },
    { type: 'transaction_alert', channel: 'push_notification', enabled: true },
    { type: 'transaction_alert', channel: 'sms', enabled: false }, // Often SMS is opt-in for standard alerts

    // Deposit Notifications
    { type: 'deposit_notification', channel: 'email', enabled: true },
    { type: 'deposit_notification', channel: 'push_notification', enabled: true },

    // Withdrawal Notifications (often crucial, so SMS might be enabled)
    { type: 'withdrawal_notification', channel: 'email', enabled: true },
    { type: 'withdrawal_notification', channel: 'push_notification', enabled: true },
    { type: 'withdrawal_notification', channel: 'sms', enabled: true },

    // Bill Reminders
    { type: 'bill_reminder', channel: 'email', enabled: true },
    { type: 'bill_reminder', channel: 'push_notification', enabled: true },
    { type: 'bill_reminder', channel: 'sms', enabled: false },

    // Loan Related
    { type: 'loan_due_date', channel: 'email', enabled: true },
    { type: 'loan_due_date', channel: 'push_notification', enabled: true },
    { type: 'loan_repayment_confirmation', channel: 'email', enabled: true },
    { type: 'loan_repayment_confirmation', channel: 'push_notification', enabled: true },

    // Budget Alerts
    { type: 'budget_threshold_alert', channel: 'email', enabled: true },
    { type: 'budget_threshold_alert', channel: 'push_notification', enabled: true },

    // Card Activity
    { type: 'card_activity_alert', channel: 'email', enabled: true },
    { type: 'card_activity_alert', channel: 'push_notification', enabled: true },

    // Security Alerts (HIGHLY RECOMMENDED to be on by default across all crucial channels)
    { type: 'security_alert', channel: 'email', enabled: true },
    { type: 'security_alert', channel: 'push_notification', enabled: true },
    { type: 'security_alert', channel: 'sms', enabled: true },

    // Marketing & Promotions (usually opt-in / default off)
    { type: 'marketing_promotion', channel: 'email', enabled: false },
    { type: 'marketing_promotion', channel: 'sms', enabled: false },
    { type: 'marketing_promotion', channel: 'push_notification', enabled: false },
    { type: 'marketing_promotion', channel: 'in_app', enabled: true }, // In-app might be default on for passive marketing
];