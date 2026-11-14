"use server"

/* eslint-disable @typescript-eslint/no-explicit-any */
import { DB } from "@/db";
import { createActionResult, withPagination } from "@/db/helpers/withPagination";
import schemas from "@/db/schemas";
import {
    ActionResult,
    Transaction,
    TransactionTypeEnum,
    PaginatedResult,
    NewTransaction,
} from "@/types/db";
import { eq, and, desc, lt, ilike } from "drizzle-orm"; // Import ilike for search
import { revalidatePath } from "next/cache";

export async function processTransaction(
    data: NewTransaction
) {
    const { accountId, type, amount, description, createdAt } = data;

    // Use a database transaction to ensure atomicity
    return await DB.transaction(async (tx) => {
        try {
            const currentAccount = await tx.query.bankAccounts.findFirst({
                where: eq(schemas.bankAccounts.id, accountId),
            });

            if (!currentAccount) {
                tx.rollback();
                return createActionResult(false, undefined, "NotFound", "Bank account not found.");
            }

            let newBalance = parseFloat(currentAccount.balance);

            if (type === 'deposit') {
                newBalance += Number(amount);
            } else if (type === 'withdrawal') {
                if (newBalance < Number(amount)) {
                    tx.rollback();
                    return createActionResult(false, undefined, "ClientError", "Insufficient funds.");
                }
                newBalance -= Number(amount);
            } else {
                tx.rollback();
                return createActionResult(false, undefined, "ClientError", "Invalid transaction type.");
            }

            // Step 1: Update the bank account balance
            await tx.update(schemas.bankAccounts)
                .set({ balance: newBalance.toFixed(2) })
                .where(eq(schemas.bankAccounts.id, accountId));

            // Step 2: Create a new transaction record
            await tx.insert(schemas.transactions)
                .values({
                    userId: currentAccount.userId,
                    accountId: currentAccount.id,
                    amount,
                    type,
                    description,
                    status: 'completed',
                    createdAt: createdAt ? createdAt : new Date()
                });

            return createActionResult(true, { message: "Transaction completed successfully." });
        } catch (error: any) {
            tx.rollback();
            console.error("Transaction failed:", error);
            return createActionResult(false, undefined, "ServerError", "Failed to process transaction.");
        }
    });
}

/**
 * Fetches a paginated list of ALL transactions (for admin use only),
 * using cursor-based pagination by `createdAt` and optional filters.
 * Requires administrator privileges.
 *
 * @param {object} [filters] - Optional filters for transactions.
 * @param {string} [filters.type] - Filter by transaction type (e.g., 'deposit', 'withdrawal').
 * @param {string} [filters.status] - Filter by transaction status (e.g., 'completed', 'pending').
 * @param {string} [filters.search] - Search description or transaction reference.
 * @param {string} [filters.accountId] - Filter by a specific bank account ID.
 * @param {string} [filters.cardId] - NEW: Filter by a specific card ID.
 * @param {string} [cursor] - The `createdAt` timestamp of the last record from the previous fetch to start from.
 * @param {number} [limit=10] - The maximum number of items to retrieve per fetch.
 * @returns {Promise<ActionResult<PaginatedResult<Transaction> | undefined>>}
 * A promise that resolves to an ActionResult containing the paginated list of transactions, or an error if unauthorized.
 */
export async function getTransactionsByAdminAction(
    filters?: {
        type?: TransactionTypeEnum;
        status?: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
        search?: string;
        accountId?: string;
        cardId?: string; // Add cardId to filters
        userId?: string; // Re-add userId filter for admin
    },
    cursor?: string, // Cursor parameter
    limit: number = 10 // Limit per fetch
): Promise<ActionResult<PaginatedResult<Transaction> | undefined>> {
    try {
        // Build the WHERE clause dynamically
        const conditions: any[] = []; // Use any[] for conditions to accommodate various types

        if (filters?.userId) { // Admin can filter by a specific user's transactions
            conditions.push(eq(schemas.transactions.userId, filters.userId));
        }
        if (filters?.type) {
            conditions.push(eq(schemas.transactions.type, filters.type));
        }
        if (filters?.status) {
            conditions.push(eq(schemas.transactions.status, filters.status));
        }
        if (filters?.accountId) {
            conditions.push(eq(schemas.transactions.accountId, filters.accountId));
        }

        if (filters?.search) {
            const searchTerm = `%${filters.search.toLowerCase()}%`;
            conditions.push(
                // Use `ilike` for case-insensitive partial matches
                // or `like` for case-sensitive
                // Drizzle-ORM has `or` for combining conditions
                // For 'search' across multiple columns, you'd typically use `or`
                // Example:
                // or(
                //     ilike(schemas.transactions.description, searchTerm),
                //     ilike(schemas.transactions.transactionRef, searchTerm)
                // )
                // For simplicity, I'll apply it to description, you can extend
                ilike(schemas.transactions.description, searchTerm)
            );
        }

        // Add cursor condition: fetch items created BEFORE the cursor timestamp
        if (cursor) {
            conditions.push(lt(schemas.transactions.createdAt, new Date(cursor)));
        }

        const rawTransactions = await DB.query.transactions.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined, // Apply conditions only if present
            orderBy: [desc(schemas.transactions.createdAt)],
            limit: limit + 1,
            with: {
                account: {
                    columns: {
                        accountName: true,
                        accountNumber: true,
                        currency: true
                    }
                },
            }
        });

        const paginatedResult = await withPagination(rawTransactions, limit, 'createdAt');

        return createActionResult(
            true,
            paginatedResult,
            undefined,
            "Transactions retrieved successfully."
        );
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to retrieve transactions');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Fetches a paginated list of transactions for a given user, using cursor-based pagination by `createdAt`.
 *
 * @param {string} userId - The ID of the user whose transactions to fetch.
 * @param {object} [filters] - Optional filters for transactions.
 * @param {string} [filters.type] - Filter by transaction type (e.g., 'deposit', 'withdrawal').
 * @param {string} [filters.status] - Filter by transaction status (e.g., 'completed', 'pending').
 * @param {string} [filters.search] - Search description or transaction reference.
 * @param {string} [filters.accountId] - Filter by a specific bank account ID.
 * @param {string} [filters.cardId] - NEW: Filter by a specific card ID.
 * @param {string} [cursor] - The `createdAt` timestamp of the last record from the previous fetch to start from.
 * @param {number} [limit=10] - The maximum number of items to retrieve per fetch.
 * @returns {Promise<ActionResult<PaginatedResult<Transaction>>>}
 * A promise that resolves to an ActionResult containing the paginated list of transactions and a next cursor.
 */
export async function getTransactionsAction(
    userId: string,
    filters?: {
        type?: TransactionTypeEnum;
        status?: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
        search?: string;
        accountId?: string;
        cardId?: string; // Add cardId to filters
    },
    cursor?: string, // Cursor parameter
    limit: number = 10 // Limit per fetch
): Promise<ActionResult<PaginatedResult<Transaction> | undefined>> {
    try {
        const conditions: any[] = [
            eq(schemas.transactions.userId, userId)
        ];

        if (filters?.type) {
            conditions.push(eq(schemas.transactions.type, filters.type));
        }
        if (filters?.status) {
            conditions.push(eq(schemas.transactions.status, filters.status));
        }
        if (filters?.accountId) {
            conditions.push(eq(schemas.transactions.accountId, filters.accountId));
        }
        if (filters?.search) {
            const searchTerm = `%${filters.search.toLowerCase()}%`;
            conditions.push(
                ilike(schemas.transactions.description, searchTerm)
            );
        }

        // Add cursor condition: fetch items created BEFORE the cursor timestamp
        if (cursor) {
            conditions.push(lt(schemas.transactions.createdAt, new Date(cursor)));
        }

        const rawTransactions = await DB.query.transactions.findMany({
            where: and(...conditions),
            orderBy: [desc(schemas.transactions.createdAt)],
            limit: limit + 1,
            // with: {
            //     account: {
            //         columns: {
            //             accountName: true,
            //             accountNumber: true,
            //             currency: true
            //         }
            //     },
            //     // Include card details if needed for display on the user's dashboard
            //     card: {
            //         columns: {
            //             lastFourDigits: true,
            //             cardBrand: true,
            //             cardHolderName: true,
            //         }
            //     }
            // }
        });

        const paginatedResult = await withPagination(rawTransactions, limit, 'createdAt');

        return createActionResult(
            true,
            paginatedResult,
            undefined,
            "Transactions retrieved successfully."
        );
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to retrieve transactions');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Deletes a transaction and reverts the balance on the associated bank account.
 * This function should only be callable by the user who owns the transaction or an admin.
 * * @param {string} transactionId - The ID of the transaction to delete.
 * @param {string} userId - The ID of the user requesting the deletion (for authorization).
 * @returns {Promise<ActionResult<string | undefined>>}
 * A promise that resolves to an ActionResult indicating success or failure.
 */
export async function deleteTransaction(
    transactionId: string,
    userId: string, // The ID of the user performing the action
): Promise<ActionResult<string | undefined>> {
    return await DB.transaction(async (tx) => {
        try {
            // Find the transaction to be deleted
            const transactionToDelete = await tx.query.transactions.findFirst({
                where: eq(schemas.transactions.id, transactionId),
                with: {
                    account: true, // Eager load the account to update its balance
                }
            });

            // Check if the transaction exists and the user has permission to delete it
            if (!transactionToDelete) {
                return createActionResult(false, undefined, "NotFound", "Transaction not found.");
            }

            if (transactionToDelete.userId !== userId) {
                return createActionResult(false, undefined, "Unauthorized", "You do not have permission to delete this transaction.");
            }

            // Calculate the amount to revert the balance
            let balanceRevertAmount = Number(transactionToDelete.amount);

            // If the original transaction was a withdrawal, we need to add the amount back.
            // If it was a deposit, we need to subtract it.
            if (transactionToDelete.type === 'withdrawal') {
                balanceRevertAmount = -balanceRevertAmount;
            }

            // Find the bank account to update
            const currentAccount = transactionToDelete.account;
            if (!currentAccount) {
                return createActionResult(false, undefined, "NotFound", "Associated bank account not found.");
            }

            // Update the bank account balance
            const newBalance = parseFloat(currentAccount.balance) - balanceRevertAmount;
            await tx.update(schemas.bankAccounts)
                .set({ balance: newBalance.toFixed(2) })
                .where(eq(schemas.bankAccounts.id, currentAccount.id));

            // Delete the transaction record
            await tx.delete(schemas.transactions)
                .where(eq(schemas.transactions.id, transactionId));

            revalidatePath(`/dashboard`); // General accounts list
            revalidatePath(`/dashboard/bank-accounts`); // Newly created account's page
            revalidatePath(`/dashboard/cards`); // User's profile might show linked accounts
            revalidatePath(`/admin/users`); // If admin view includes user's accounts
            return createActionResult(true, "Transaction deleted successfully.");
        } catch (error: any) {
            tx.rollback();
            console.error("Transaction deletion failed:", error);
            return createActionResult(false, undefined, "ServerError", "Failed to delete transaction.");
        }
    });
}
