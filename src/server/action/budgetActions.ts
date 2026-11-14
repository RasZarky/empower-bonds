// src/app/api/actions/budget.ts
'use server';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { DB } from "@/db";
import { createActionResult, withPagination } from "@/db/helpers/withPagination"; // Corrected typo
import schemas from "@/db/schemas";
import { and, eq, inArray, lt, not, sum } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
    ActionResult,
    BudgetWithCategories,
    NewBudget,
    NewBudgetCategory,
    Transaction,
    PaginatedResult,
    Budget,
    NewTransaction, // Import NewTransaction type
} from "@/types/db";
import { sql } from "drizzle-orm"; // Needed for arithmetic operations in Drizzle
import bcrypt from "bcrypt";

// --- Helper Functions ---

/**
 * Records a transaction for an expenditure/payment.
 * This helper is used internally by budget/expenditure actions.
 *
 * @param {Omit<NewTransaction, 'id' | 'createdAt' | 'updatedAt'>} transactionData - Data for the new transaction.
 * @returns {Promise<Transaction>} The created transaction record.
 */
async function recordTransaction(
    transactionData: Omit<NewTransaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Transaction> {
    const [transaction] = await DB
        .insert(schemas.transactions)
        .values(transactionData)
        .returning();

    if (!transaction) {
        throw new Error("Failed to record transaction.");
    }
    return transaction;
}

// --- Budget Actions ---

/**
 * Creates a new budget along with its associated categories.
 * This operation is wrapped in a transaction to ensure atomicity.
 *
 * @param {string} userId - The ID of the user creating the budget.
 * @param {string} accountId - The ID of the bank account associated with this budget.
 * @param {Omit<NewBudget, 'userId' | 'accountId'>} budgetData - The data for the new budget (excluding userId and accountId).
 * @param {Omit<NewBudgetCategory, 'budgetId' | 'spentAmount'>[]} categories - An array of category data for the new budget.
 * `spentAmount` is omitted as it starts at 0.
 * @returns {Promise<ActionResult<BudgetWithCategories | undefined>>} An action result containing the created budget with its categories, or an error.
 */
export async function createBudgetAction(
    userId: string,
    accountId: string, // Use accountId instead of cardId for budget linkage
    budgetData: Omit<NewBudget, 'userId' | 'accountId'>, // Updated to accountId
    categories: Omit<NewBudgetCategory, 'budgetId' | 'spentAmount'>[] // `spentAmount` initialized to 0
): Promise<ActionResult<BudgetWithCategories | undefined>> {
    try {
        const result = await DB.transaction(async (tx) => {
            // Validate account existence and ownership (optional, but good for security)
            const accountExists = await tx.query.bankAccounts.findFirst({
                where: and(eq(schemas.bankAccounts.id, accountId), eq(schemas.bankAccounts.userId, userId))
            });
            if (!accountExists) {
                throw new Error("Associated bank account not found or does not belong to the user.");
            }

            // Create budget
            const [budget] = await tx
                .insert(schemas.budgets)
                .values({
                    ...budgetData,
                    userId,
                    actualSpent: "0.00", // Initialize actualSpent
                })
                .returning();

            if (!budget) {
                throw new Error("Failed to create budget.");
            }

            // Prepare categories for batch insert
            const categoriesToInsert = categories.map(category => ({
                ...category,
                budgetId: budget.id,
                spentAmount: "0.00", // Initialize spentAmount for each category
            }));

            // Add categories if provided
            let createdCategories: typeof schemas.budgetCategory.$inferSelect[] = [];
            if (categoriesToInsert.length > 0) {
                createdCategories = await tx.insert(schemas.budgetCategory)
                    .values(categoriesToInsert)
                    .returning();
            }

            return {
                budget,
                categories: createdCategories,
            };
        });

        revalidatePath('/dashboard/financing'); // Revalidate relevant paths
        return createActionResult<BudgetWithCategories>(true, result, undefined, "Budget created successfully.");
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to create budget');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Updates an existing budget and its categories.
 * This operation is wrapped in a transaction to ensure atomicity.
 * It handles adding new categories, updating existing ones, and deleting removed ones.
 *
 * @param {string} budgetId - The ID of the budget to update.
 * @param {string} userId - The ID of the user who owns the budget (for authorization).
 * @param {Partial<NewBudget>} budgetData - Partial budget data to update.
 * @param {Array<Partial<NewBudgetCategory> & { id?: string }>} [categories] - Array of category data for update/create/delete.
 * @returns {Promise<ActionResult<BudgetWithCategories | undefined>>} An action result containing the updated budget with its categories, or an error.
 */
export async function updateBudgetAction(
    budgetId: string,
    userId: string,
    budgetData: Partial<NewBudget>,
    categories?: Array<Partial<NewBudgetCategory> & { id?: string }>
): Promise<ActionResult<BudgetWithCategories | undefined>> {
    try {
        const result = await DB.transaction(async (tx) => {
            // Verify budget ownership
            const existingBudget = await tx.query.budgets.findFirst({
                where: and(eq(schemas.budgets.id, budgetId), eq(schemas.budgets.userId, userId))
            });

            if (!existingBudget) {
                throw new Error("Budget not found or not owned by user.");
            }

            // Update main budget fields
            const [updatedBudget] = await tx
                .update(schemas.budgets)
                .set(budgetData)
                .where(and(eq(schemas.budgets.id, budgetId), eq(schemas.budgets.userId, userId)))
                .returning();

            if (!updatedBudget) {
                throw new Error("Failed to update budget main details.");
            }

            // Update categories if provided
            if (categories) {
                const existingCategoryIds = categories
                    .filter(cat => cat.id)
                    .map(cat => cat.id) as string[];

                // Delete categories that are no longer present in the updated list
                await tx
                    .delete(schemas.budgetCategory)
                    .where(
                        and(
                            eq(schemas.budgetCategory.budgetId, budgetId),
                            not(inArray(schemas.budgetCategory.id, existingCategoryIds.length > 0 ? existingCategoryIds : ['dummy_id_to_prevent_deleting_all'])) // Prevents deleting all if categoryIds is empty
                        )
                    );

                // Upsert categories (update existing, insert new)
                for (const category of categories) {
                    if (category.id) {
                        // Update existing category
                        await tx
                            .update(schemas.budgetCategory)
                            .set({
                                category: category.category,
                                amount: category.amount,
                                // spentAmount is NOT updated here, it's updated via transactions
                            })
                            .where(
                                and(
                                    eq(schemas.budgetCategory.id, category.id),
                                    eq(schemas.budgetCategory.budgetId, budgetId)
                                )
                            );
                    } else {
                        // Insert new category
                        await tx.insert(schemas.budgetCategory)
                            .values({
                                budgetId,
                                category: category.category!,
                                amount: category.amount!,
                                spentAmount: "0.00", // New categories start with 0 spent
                            });
                    }
                }
            }

            // Get complete updated budget with categories
            const finalBudget = await tx.query.budgets.findFirst({
                where: eq(schemas.budgets.id, budgetId),
                with: { categories: true }
            });

            if (!finalBudget) {
                throw new Error("Failed to retrieve updated budget details.");
            }

            return {
                budget: finalBudget, // Drizzle returns the main entity when using 'with'
                categories: finalBudget.categories || []
            };
        });

        revalidatePath('/dashboard/financing');
        revalidatePath(`/dashboard/financing/${budgetId}`);
        return createActionResult<BudgetWithCategories>(true, result, undefined, "Budget updated successfully.");
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to update budget');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Deletes a specific budget and its associated categories.
 * The operation is atomic, ensuring both are removed or neither.
 *
 * @param {string} budgetId - The ID of the budget to delete.
 * @param {string} userId - The ID of the user who owns the budget (for authorization).
 * @returns {Promise<ActionResult<{ id: string } | undefined>>} An action result indicating success or failure of deletion.
 */
export async function deleteBudgetAction(
    budgetId: string,
    userId: string
): Promise<ActionResult<{ id: string } | undefined>> {
    try {
        const [deletedBudget] = await DB.transaction(async (tx) => {
            // Delete the budget (categories will be cascade deleted if foreign key is set up with onDelete: 'cascade')
            // Otherwise, delete categories explicitly first: await tx.delete(schemas.budgetCategory).where(eq(schemas.budgetCategory.budgetId, budgetId));
            return await tx
                .delete(schemas.budgets)
                .where(and(eq(schemas.budgets.id, budgetId), eq(schemas.budgets.userId, userId)))
                .returning({ id: schemas.budgets.id });
        });

        if (!deletedBudget) {
            return createActionResult<undefined>(false, undefined, "NotFound", "Budget not found or not owned by user.");
        }

        revalidatePath('/dashboard/financing');
        return createActionResult<{ id: string }>(true, deletedBudget, undefined, "Budget deleted successfully.");
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to delete budget');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Retrieves a specific budget by its ID, including its categories.
 *
 * @param {string} budgetId - The ID of the budget to retrieve.
 * @param {string} userId - The ID of the user who owns the budget (for authorization).
 * @returns {Promise<ActionResult<BudgetWithCategories | undefined>>} An action result containing the budget with categories, or an error.
 */
export async function getBudgetByIdAction(
    budgetId: string,
    userId: string
): Promise<ActionResult<BudgetWithCategories | undefined>> {
    try {
        // Use Drizzle's query relations to fetch budget with categories in one go
        const budgetWithCategories = await DB.query.budgets.findFirst({
            where: and(eq(schemas.budgets.id, budgetId), eq(schemas.budgets.userId, userId)),
            with: {
                categories: true, // Eager load categories
            },
        });

        if (!budgetWithCategories) {
            return createActionResult<undefined>(false, undefined, "NotFound", "Budget not found or not owned by user.");
        }

        // Separate budget and categories for the return type structure
        const { categories, ...budget } = budgetWithCategories;

        return createActionResult<BudgetWithCategories>(true, {
            budget,
            categories: categories || []
        }, undefined, "Budget retrieved successfully.");
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to fetch budget');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Retrieves a paginated list of all budgets for a specific user.
 *
 * @param {string} userId - The ID of the user.
 * @param {number} [pageSize=10] - The number of budgets per page.
 * @param {string} [cursor] - The cursor for pagination (e.g., createdAt timestamp of the last item from the previous page).
 * @returns {Promise<ActionResult<PaginatedResult<Budget> | undefined>>} An action result containing a paginated list of budgets, or an error.
 */
export async function getUserBudgetsAction(
    userId: string,
    pageSize: number = 10,
    cursor?: string
): Promise<ActionResult<PaginatedResult<Budget> | undefined>> {
    try {
        const query = DB
            .select()
            .from(schemas.budgets)
            .where(and(
                eq(schemas.budgets.userId, userId),
                cursor ? lt(schemas.budgets.createdAt, new Date(cursor)) : undefined
            ))
            .orderBy(schemas.budgets.createdAt) // Ensure consistent ordering for cursor pagination

        const budgetsList = await query.limit(pageSize + 1); // Fetch one extra item to check for next page

        const paginatedResult = await withPagination<Budget>(
            budgetsList,
            pageSize,
            'createdAt'
        );

        return createActionResult<PaginatedResult<Budget>>(true, paginatedResult, undefined, "Budgets fetched successfully.");
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to fetch budgets');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Retrieves a paginated list of budgets for a specific user filtered by frequency.
 *
 * @param {string} userId - The ID of the user.
 * @param {"daily" | "weekly" | "bi-weekly" | "monthly" | "quarterly" | "annually"} frequency - The budget frequency to filter by.
 * @param {number} [pageSize=10] - The number of budgets per page.
 * @param {string} [cursor] - The cursor for pagination.
 * @returns {Promise<ActionResult<PaginatedResult<Budget> | undefined>>} An action result containing a paginated list of budgets, or an error.
 */
export async function getBudgetsByFrequencyAction(
    userId: string,
    frequency: "daily" | "weekly" | "bi-weekly" | "monthly" | "quarterly" | "annually",
    pageSize: number = 10,
    cursor?: string
): Promise<ActionResult<PaginatedResult<Budget> | undefined>> {
    try {
        const query = DB
            .select()
            .from(schemas.budgets)
            .where(and(
                eq(schemas.budgets.userId, userId),
                eq(schemas.budgets.frequency, frequency),
                cursor ? lt(schemas.budgets.createdAt, new Date(cursor)) : undefined
            ))
            .orderBy(schemas.budgets.createdAt); // Ensure consistent ordering for cursor pagination

        const frequencyBudgets = await query.limit(pageSize + 1); // Fetch one extra item

        const paginatedResult = await withPagination<Budget>(
            frequencyBudgets,
            pageSize,
            'createdAt'
        );

        return createActionResult<PaginatedResult<Budget>>(true, paginatedResult, undefined, "Budgets by frequency fetched successfully.");
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to fetch budgets by frequency');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Records an expenditure against a budget and its category, updating actual spent amounts.
 * This function handles the core logic for deducting spending from budgets and categories,
 * and also updates the associated bank account balance. It now correctly inserts into
 * the `actualExpenditureRecords` table with all relevant foreign keys.
 *
 * @param {string} userId - The ID of the user making the expenditure.
 * @param {string} budgetId - The ID of the budget to associate this expenditure with.
 * @param {string} budgetCategoryId - The ID of the specific budget category within the budget.
 * @param {string} amount - The amount of the expenditure.
 * @param {string} description - A description of the expenditure.
 * @param {Date} occurrenceDate - The date the expense occurred.
 * @returns {Promise<ActionResult<Transaction | undefined>>} An action result containing the recorded transaction, or an error.
 */
export async function recordExpenditureAgainstBudget(
    userId: string,
    budgetId: string,
    budgetCategoryId: string,
    amount: string,
    description: string,
    occurrenceDate: Date // Added occurrenceDate for actualExpenditureRecords
): Promise<ActionResult<Transaction | undefined>> {
    try {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            throw new Error("Invalid amount provided for expenditure.");
        }

        const result = await DB.transaction(async (tx) => {
            // 1. Verify budget and category ownership, and get cardId/accountId
            const budget = await tx.query.budgets.findFirst({
                where: and(eq(schemas.budgets.id, budgetId), eq(schemas.budgets.userId, userId)),
            });
            if (!budget) {
                throw new Error("Budget not found or not owned by user.");
            }

            const budgetCategory = await tx.query.budgetCategory.findFirst({
                where: and(eq(schemas.budgetCategory.id, budgetCategoryId), eq(schemas.budgetCategory.budgetId, budgetId)),
            });
            if (!budgetCategory) {
                throw new Error("Budget category not found within the specified budget.");
            }

            // Get the accountId linked to the budget's cardId
            const card = await tx.query.cards.findFirst({
                where: eq(schemas.cards.id, budget.cardId),
                columns: { accountId: true }
            });
            if (!card) {
                throw new Error("Associated card not found for this budget.");
            }
            const accountId = card.accountId;

            // 2. Record the transaction
            const transaction = await recordTransaction({
                userId,
                accountId, // Use the derived accountId
                amount: amount,
                type: 'purchase',
                status: 'completed',
                description: `${description} (Budget: ${budget.name}, Category: ${budgetCategory.category})`,
                transactionRef: `EXP-${Date.now()}-${userId.substring(0, 4)}`,
            });

            // 3. Update the budget's actualSpent
            await tx.update(schemas.budgets)
                .set({
                    actualSpent: sql`${schemas.budgets.actualSpent} + ${numAmount}`
                })
                .where(eq(schemas.budgets.id, budgetId));

            // 4. Update the specific budget category's spentAmount
            await tx.update(schemas.budgetCategory)
                .set({
                    spentAmount: sql`${schemas.budgetCategory.spentAmount} + ${numAmount}`
                })
                .where(eq(schemas.budgetCategory.id, budgetCategoryId));

            // 5. Deduct from the bank account balance
            const [updatedAccount] = await tx.update(schemas.bankAccounts)
                .set({
                    balance: sql`${schemas.bankAccounts.balance} - ${numAmount}`
                })
                .where(and(
                    eq(schemas.bankAccounts.id, accountId),
                    eq(schemas.bankAccounts.userId, userId)
                ))
                .returning();

            if (!updatedAccount) {
                tx.rollback();
                throw new Error("Failed to deduct amount from bank account. Insufficient funds or account not found?");
            }

            // 6. Record in the actualExpenditureRecords table with all necessary foreign keys
            await tx.insert(schemas.actualExpenditureRecords).values({ // Now correctly inserting into actualExpenditureRecords
                userId,
                accountId,
                cardId: budget.cardId,
                budgetId,
                budgetCategoryId,
                transactionId: transaction.id,
                amount: amount,
                description,
                occurrenceDate: occurrenceDate, // Use the provided occurrenceDate
            });

            return transaction;
        });

        revalidatePath('/dashboard/financing');
        revalidatePath(`/dashboard/financing/${budgetId}`);
        revalidatePath(`/dashboard/accounts/${result?.accountId}`);
        return createActionResult<Transaction>(true, result, undefined, "Expenditure recorded and budget/account updated successfully.");
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to record expenditure against budget');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

// --- Tracking Budget with Deposits/Withdrawals ---

/**
 * Handles a withdrawal from a user's bank account.
 * This function first checks for sufficient balance, then validates the transaction PIN,
 * then updates the account, and finally records the transaction, all within a database transaction.
 *
 * @param {string} userId - The ID of the user.
 * @param {string} accountId - The ID of the bank account from which the withdrawal is made.
 * @param {string} amount - The amount of the withdrawal.
 * @param {string} description - A detailed description of the withdrawal, including recipient info.
 * @param {string} transactionRef - A unique reference number for the transaction.
 * @param {string} pin - The user's transaction PIN for validation.
 * @returns {Promise<ActionResult<Transaction | undefined>>} An object conforming to the `ActionResult` interface.
 */
export async function handleWithdrawalAction(
    userId: string,
    accountId: string,
    amount: string,
    description: string,
    transactionRef: string,
    pin: string
): Promise<ActionResult<Transaction | undefined>> {
    try {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            return createActionResult<undefined>(false, undefined, "InvalidInput", "Invalid withdrawal amount. Must be a positive number.");
        }

        if (!description || description.trim() === "") {
            return createActionResult<undefined>(false, undefined, "InvalidInput", "Recipient details or description are required for withdrawal.");
        }

        if (!transactionRef || transactionRef.trim() === "") {
            return createActionResult<undefined>(false, undefined, "InvalidInput", "Transaction reference is required.");
        }

        // Validate PIN format early
        if (!pin || pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
            return createActionResult<undefined>(false, undefined, "InvalidPinFormat", "Invalid PIN format. PIN must be 4-6 digits.");
        }

        const result = await DB.transaction(async (tx) => {
            // 1. Fetch user to validate PIN
            const [user] = await tx.select()
                .from(schemas.user)
                .where(eq(schemas.user.id, userId))
                .limit(1);

            if (!user) {
                // If user not found, it's a critical error or bad userId
                throw new Error("User not found."); // This will be caught by outer try/catch
            }
            if (!user.hashedTransactionPin) {
                // If user has no PIN set, guide them to set it
                throw new Error("Transaction PIN not set. Please set a PIN in your profile settings to proceed with withdrawals.");
            }

            // Compare provided PIN with stored hashed PIN
            const isPinValid = await bcrypt.compare(pin, user.hashedTransactionPin);
            if (!isPinValid) {
                // Throwing an error here will cause the transaction to rollback
                throw new Error("Incorrect transaction PIN.");
            }

            // 2. Determine if the bank account has sufficient balance
            const [account] = await tx.select()
                .from(schemas.bankAccounts)
                .where(and(
                    eq(schemas.bankAccounts.id, accountId),
                    eq(schemas.bankAccounts.userId, userId)
                ))
                .limit(1);

            if (!account) {
                throw new Error("Bank account not found or does not belong to the user.");
            }

            console.log("ACCOUNT:: ", account)

            const currentBalance = parseFloat(account.balance as unknown as string);

            if (currentBalance < numAmount) {
                throw new Error("Insufficient funds for this withdrawal.");
            }

            const bal = currentBalance - numAmount
            console.log("BALANACE:: ", bal)

            // 3. Update the bank account balance (deduct amount)
            const [updatedAccount] = await tx.update(schemas.bankAccounts)
                .set({
                    balance: bal.toPrecision(2)
                })
                .where(eq(schemas.bankAccounts.id, accountId))
                .returning();

            if (!updatedAccount) {
                // Should not happen if select found the account, but good safeguard
                throw new Error("Failed to deduct amount from bank account after balance check.");
            }

            console.log("UPDATED ACCOUNT:: ", updatedAccount)

            // 4. Record the transaction details
            const transaction = await recordTransaction({
                userId,
                accountId,
                amount: numAmount.toPrecision(2),
                type: 'withdrawal',
                status: 'completed',
                description: description,
                transactionRef: transactionRef,
            });

            return transaction;
        });

        // If the transaction completes successfully, return a success action result
        revalidatePath('/dashboard/financing');
        revalidatePath(`/dashboard/accounts/${accountId}`);
        return createActionResult<Transaction>(true, result, undefined, "Withdrawal successfully recorded and account updated.");

    } catch (error: any) {
        // All errors (including those thrown inside the DB.transaction) are caught here.
        // We use error.message as the error string for createActionResult
        const errorMessage = error.message || 'Failed to handle withdrawal due to an unexpected error.';
        // Optionally, you can map specific error messages to custom error codes if needed
        let errorType = "ServerError";
        if (errorMessage.includes("Invalid withdrawal amount")) errorType = "InvalidInput";
        else if (errorMessage.includes("Recipient details or description")) errorType = "InvalidInput";
        else if (errorMessage.includes("Transaction reference")) errorType = "InvalidInput";
        else if (errorMessage.includes("Invalid PIN format")) errorType = "InvalidPinFormat";
        else if (errorMessage.includes("User not found")) errorType = "UserNotFound";
        else if (errorMessage.includes("Transaction PIN not set")) errorType = "PinNotSet";
        else if (errorMessage.includes("Incorrect transaction PIN")) errorType = "IncorrectPin";
        else if (errorMessage.includes("Insufficient funds")) errorType = "InsufficientFunds";
        else if (errorMessage.includes("Bank account not found")) errorType = "AccountNotFound";

        return createActionResult<undefined>(false, undefined, errorType, errorMessage);
    }
}


/**
 * Handles a deposit into a user's bank account.
 *
 * @param {string} userId - The ID of the user.
 * @param {string} accountId - The ID of the bank account into which the deposit is made.
 * @param {string} amount - The amount of the deposit.
 * @param {string} description - A description of the deposit.
 * @param {string} transactionRef - A unique reference number for the transaction.
 * @returns {Promise<ActionResult<Transaction | undefined>>} An object conforming to the `ActionResult` interface.
 */
export async function handleDepositAction(
    userId: string,
    accountId: string,
    amount: string,
    description: string,
    transactionRef: string
): Promise<ActionResult<Transaction | undefined>> {
    try {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            return createActionResult<undefined>(false, undefined, "InvalidInput", "Invalid deposit amount. Must be a positive number.");
        }

        if (!transactionRef || transactionRef.trim() === "") {
            return createActionResult<undefined>(false, undefined, "InvalidInput", "Transaction reference is required.");
        }

        const result = await DB.transaction(async (tx) => {
            // For deposit, we just need to ensure the account exists before updating.
            const [account] = await tx.select()
                .from(schemas.bankAccounts)
                .where(and(
                    eq(schemas.bankAccounts.id, accountId),
                    eq(schemas.bankAccounts.userId, userId)
                ))
                .for("update") // Lock the row for update
                .limit(1);

            if (!account) {
                throw new Error("Bank account not found or does not belong to the user.");
            }

            // 1. Add to the bank account balance
            const [updatedAccount] = await tx.update(schemas.bankAccounts)
                .set({
                    balance: sql`${schemas.bankAccounts.balance} + ${numAmount}`
                })
                .where(eq(schemas.bankAccounts.id, accountId))
                .returning();

            if (!updatedAccount) {
                throw new Error("Failed to add amount to bank account.");
            }

            // 2. Record the transaction
            const transaction = await recordTransaction({
                userId,
                accountId,
                amount: numAmount.toPrecision(2),
                type: 'deposit',
                status: 'completed',
                description: description,
                transactionRef: transactionRef,
            });

            return transaction;
        });

        // If the transaction completes successfully, return a success action result
        revalidatePath('/dashboard/financing');
        revalidatePath(`/dashboard/accounts/${accountId}`);
        return createActionResult<Transaction>(true, result, undefined, "Deposit successfully recorded and account updated.");

    } catch (error: any) {
        const errorMessage = error.message || 'Failed to handle deposit due to an unexpected error.';
        let errorType = "ServerError";
        if (errorMessage.includes("Invalid deposit amount")) errorType = "InvalidInput";
        else if (errorMessage.includes("Transaction reference")) errorType = "InvalidInput";
        else if (errorMessage.includes("Bank account not found")) errorType = "AccountNotFound";
        else if (errorMessage.includes("Failed to add amount")) errorType = "UpdateFailed";


        return createActionResult<undefined>(false, undefined, errorType, errorMessage);
    }
}

/**
 * Retrieves an overall summary of a user's budgeting, including total budgeted amount,
 * total spent, remaining balance, and a calculated budget health percentage.
 *
 * @param {string} userId - The ID of the user.
 * @returns {Promise<ActionResult<{
 * totalBudgetedAmount: string;
 * totalSpentSoFar: string;
 * budgetBalanceRemaining: string;
 * budgetHealthPercentage: number;
 * budgetHealthStatus: "Excellent" | "Good" | "Needs Attention";
 * } | undefined>>} An action result containing the budget summary, or an error.
 */
export async function getOverallBudgetSummaryAction(
    userId: string
): Promise<ActionResult<{
    totalBudgetedAmount: string;
    totalSpentSoFar: string;
    budgetBalanceRemaining: string;
    budgetHealthPercentage: number;
    budgetHealthStatus: "Excellent" | "Good" | "Needs Attention";
} | undefined>> {
    try {
        const result = await DB.select({
            // Sum all budget amounts, ensuring numeric conversion
            totalBudgetedAmount: sum(sql`${schemas.budgets.budgetAmount}::numeric`),
            // Sum all actual spent amounts, ensuring numeric conversion
            totalSpentSoFar: sum(sql`${schemas.budgets.actualSpent}::numeric`),
        })
            .from(schemas.budgets)
            .where(eq(schemas.budgets.userId, userId));

        const aggregated = result[0];

        // Parse to float, defaulting to 0 if null/undefined
        const totalBudgeted = parseFloat(aggregated?.totalBudgetedAmount || "0.00");
        const totalSpent = parseFloat(aggregated?.totalSpentSoFar || "0.00");

        const budgetBalanceRemaining = totalBudgeted - totalSpent;

        let budgetHealthPercentage = 0;
        let budgetHealthStatus: "Excellent" | "Good" | "Needs Attention" = "Needs Attention";

        if (totalBudgeted > 0) {
            // Calculate health based on remaining budget relative to total budgeted
            budgetHealthPercentage = (budgetBalanceRemaining / totalBudgeted) * 100;

            if (budgetHealthPercentage >= 75) {
                budgetHealthStatus = "Excellent";
            } else if (budgetHealthPercentage >= 55) {
                budgetHealthStatus = "Good";
            } else {
                budgetHealthStatus = "Needs Attention";
            }
        } else if (totalBudgeted === 0 && totalSpent > 0) {
            // Edge case: Spent money but no budget defined.
            // This implies "bad" health, or could be N/A depending on interpretation.
            // For now, setting to 0% and "Needs Attention"
            budgetHealthPercentage = 0;
            budgetHealthStatus = "Needs Attention";
        } else {
            // totalBudgeted is 0 and totalSpent is 0, implying no budget/spending yet
            budgetHealthPercentage = 100; // No spending, so 100% "remaining" effectively
            budgetHealthStatus = "Good"; // Or "No Budget Set" as a different status
        }

        return createActionResult(true, {
            totalBudgetedAmount: totalBudgeted.toFixed(2),
            totalSpentSoFar: totalSpent.toFixed(2),
            budgetBalanceRemaining: budgetBalanceRemaining.toFixed(2),
            budgetHealthPercentage: parseFloat(budgetHealthPercentage.toFixed(2)),
            budgetHealthStatus,
        }, undefined, "Overall budget summary retrieved successfully.");

    } catch (error: any) {
        const err = new Error(error.message || 'Failed to retrieve overall budget summary');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}