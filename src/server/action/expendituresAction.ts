// src/app/api/actions/expenditure.ts
'use server';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { DB } from "@/db";
import { createActionResult, withPagination } from "@/db/helpers/withPagination";
import schemas from "@/db/schemas";
import { and, eq, gte, lte, desc, sum, sql, lt, not } from "drizzle-orm"; // Added sum, sql
import { revalidatePath } from "next/cache";
import {
    ActionResult,
    NewExpenditure,
    UpdateExpenditure,
    Expenditure, // Ensure Expenditure type is imported
    PaginatedResult, // Ensure PaginatedResult type is imported
    BudgetCategoryEnum, // Ensure BudgetCategoryEnum is imported
} from "@/types/db"; // Assuming your types are correctly defined here



/**
 * Creates a new expenditure.
 *
 * @param {string} userId - The ID of the user creating the expenditure.
 * @param {Omit<NewExpenditure, 'userId'>} expenditureData - The data for the new expenditure.
 * @returns {Promise<ActionResult<Expenditure | undefined>>} An action result containing the created expenditure, or an error.
 */
export async function createExpenditureAction( // Renamed to follow convention
    userId: string,
    expenditureData: Omit<NewExpenditure, 'userId'>
): Promise<ActionResult<Expenditure | undefined>> {
    try {
        const [newExpenditure] = await DB
            .insert(schemas.expenditures)
            .values({
                ...expenditureData,
                userId
            })
            .returning();

        if (!newExpenditure) {
            return createActionResult<undefined>(false, undefined, "CreationFailed", "Failed to create expenditure.");
        }

        revalidatePath('/dashboard/financing');
        revalidatePath('/dashboard'); // Revalidate dashboard if it shows expenses
        return createActionResult(true, newExpenditure, undefined, "Expenditure created successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || 'Failed to create expenditure');
    }
}

/**
 * Updates an existing expenditure.
 *
 * @param {string} expenditureId - The ID of the expenditure to update.
 * @param {string} userId - The ID of the user who owns the expenditure (for authorization).
 * @param {UpdateExpenditure} expenditureData - Partial expenditure data to update.
 * @returns {Promise<ActionResult<Expenditure | undefined>>} An action result containing the updated expenditure, or an error.
 */
export async function updateExpenditureAction( // Renamed to follow convention
    expenditureId: string,
    userId: string,
    expenditureData: UpdateExpenditure
): Promise<ActionResult<Expenditure | undefined>> {
    try {
        const [updatedExpenditure] = await DB
            .update(schemas.expenditures)
            .set(expenditureData)
            .where(and(
                eq(schemas.expenditures.id, expenditureId),
                eq(schemas.expenditures.userId, userId)
            ))
            .returning();

        if (!updatedExpenditure) {
            return createActionResult<undefined>(false, undefined, "NotFound", "Expenditure not found or not owned by user.");
        }

        revalidatePath('/dashboard/financing');
        revalidatePath('/dashboard');
        revalidatePath(`/dashboard/financing/expenditures/${expenditureId}`); // Revalidate specific expenditure page
        return createActionResult(true, updatedExpenditure, undefined, "Expenditure updated successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || 'Failed to update expenditure');
    }
}

/**
 * Deletes an expenditure.
 *
 * @param {string} expenditureId - The ID of the expenditure to delete.
 * @param {string} userId - The ID of the user who owns the expenditure (for authorization).
 * @returns {Promise<ActionResult<{ id: string } | undefined>>} An action result indicating success or failure of deletion.
 */
export async function deleteExpenditureAction( // Renamed to follow convention
    expenditureId: string,
    userId: string
): Promise<ActionResult<{ id: string } | undefined>> {
    try {
        const [deletedExpenditure] = await DB
            .delete(schemas.expenditures)
            .where(and(
                eq(schemas.expenditures.id, expenditureId),
                eq(schemas.expenditures.userId, userId)
            ))
            .returning({ id: schemas.expenditures.id });

        if (!deletedExpenditure) {
            return createActionResult<undefined>(false, undefined, "NotFound", "Expenditure not found or not owned by user.");
        }

        revalidatePath('/dashboard/financing');
        revalidatePath('/dashboard');
        revalidatePath(`/dashboard/financing/expenditures/${expenditureId}`);
        return createActionResult(true, deletedExpenditure, undefined, "Expenditure deleted successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || 'Failed to delete expenditure');
    }
}

/**
 * Retrieves a specific expenditure by its ID, including its associated budget and category.
 *
 * @param {string} expenditureId - The ID of the expenditure to retrieve.
 * @param {string} userId - The ID of the user who owns the expenditure (for authorization).
 * @returns {Promise<ActionResult<Expenditure | undefined>>} An action result containing the expenditure, or an error.
 */
export async function getExpenditureByIdAction( // Renamed to follow convention
    expenditureId: string,
    userId: string
): Promise<ActionResult<Expenditure | undefined>> {
    try {
        const expenditure = await DB.query.expenditures.findFirst({
            where: and(
                eq(schemas.expenditures.id, expenditureId),
                eq(schemas.expenditures.userId, userId)
            ),
            with: {
                budget: true,
                budgetCategory: true, // Include budget category
                actualRecords: true, // Include actual records if needed
            }
        });

        if (!expenditure) {
            return createActionResult<undefined>(false, undefined, "NotFound", "Expenditure not found or not owned by user.");
        }

        return createActionResult(true, expenditure, undefined, "Expenditure retrieved successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || 'Failed to fetch expenditure');
    }
}

/**
 * Fetches a paginated list of all expenditures for a user.
 *
 * @param {string} userId - The ID of the user.
 * @param {number} [limit=10] - The number of expenditures per page.
 * @param {string} [cursor] - The cursor for pagination (createdAt timestamp).
 * @returns {Promise<ActionResult<PaginatedResult<Expenditure[]> | undefined>>} An action result containing a paginated list of expenditures, or an error.
 */
export async function getUserExpendituresAction( // Renamed to follow convention
    userId: string,
    limit: number = 10,
    cursor?: string
): Promise<ActionResult<PaginatedResult<Expenditure> | undefined>> {
    try {
        const conditions = [eq(schemas.expenditures.userId, userId)];
        if (cursor) {
            conditions.push(lt(schemas.expenditures.createdAt, new Date(cursor)));
        }

        const rawExpenditures = await DB.query.expenditures.findMany({
            where: and(...conditions),
            orderBy: [desc(schemas.expenditures.createdAt)], // Use createdAt for cursor pagination
            limit: limit + 1,
            with: {
                budget: true,
                budgetCategory: true,
            }
        });

        const paginatedResult = await withPagination<Expenditure>(
            rawExpenditures,
            limit,
            'createdAt'
        );

        return createActionResult(true, paginatedResult, undefined, "User expenditures fetched successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || 'Failed to fetch expenditures');
    }
}

/**
 * Fetches a paginated list of expenditures for a specific budget.
 *
 * @param {string} budgetId - The ID of the budget.
 * @param {string} userId - The ID of the user who owns the budget (for authorization).
 * @param {number} [limit=10] - The number of expenditures per page.
 * @param {string} [cursor] - The cursor for pagination.
 * @returns {Promise<ActionResult<PaginatedResult<Expenditure[]> | undefined>>} An action result containing a paginated list of expenditures, or an error.
 */
export async function getExpendituresByBudgetAction( // Renamed to follow convention
    budgetId: string,
    userId: string,
    limit: number = 10,
    cursor?: string
): Promise<ActionResult<PaginatedResult<Expenditure> | undefined>> {
    try {
        const conditions = [
            eq(schemas.expenditures.budgetId, budgetId),
            eq(schemas.expenditures.userId, userId)
        ];
        if (cursor) {
            conditions.push(lt(schemas.expenditures.createdAt, new Date(cursor)));
        }

        const rawExpenditures = await DB.query.expenditures.findMany({
            where: and(...conditions),
            orderBy: [desc(schemas.expenditures.createdAt)],
            limit: limit + 1,
            with: {
                budget: true,
                budgetCategory: true,
            }
        });

        const paginatedResult = await withPagination<Expenditure>(
            rawExpenditures,
            limit,
            'createdAt'
        );

        return createActionResult(true, paginatedResult, undefined, "Expenditures by budget fetched successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || 'Failed to fetch budget expenditures');
    }
}

/**
 * Fetches a paginated list of expenditures for a specific category.
 *
 * @param {string} userId - The ID of the user.
 * @param {BudgetCategoryEnum} category - The budget category to filter by.
 * @param {Date} [startDate] - Optional start date for the range.
 * @param {Date} [endDate] - Optional end date for the range.
 * @param {number} [limit=10] - The number of expenditures per page.
 * @param {string} [cursor] - The cursor for pagination.
 * @returns {Promise<ActionResult<PaginatedResult<Expenditure[]> | undefined>>} An action result containing a paginated list of expenditures, or an error.
 */
export async function getExpendituresByCategoryAction( // Renamed to follow convention
    userId: string,
    category: BudgetCategoryEnum, // Using the correct enum type
    startDate?: Date,
    endDate?: Date,
    limit: number = 10,
    cursor?: string
): Promise<ActionResult<PaginatedResult<Expenditure> | undefined>> {
    try {
        const conditions: any[] = [
            eq(schemas.expenditures.userId, userId),
            // Join with budgetCategory to filter by its 'category' enum
            eq(schemas.budgetCategory.category, category)
        ];

        if (startDate) {
            conditions.push(gte(schemas.expenditures.createdAt, startDate)); // Use createdAt for filtering
        }
        if (endDate) {
            conditions.push(lte(schemas.expenditures.createdAt, endDate)); // Use createdAt for filtering
        }
        if (cursor) {
            conditions.push(lt(schemas.expenditures.createdAt, new Date(cursor)));
        }

        // Need to join with budgetCategory table to filter by category enum
        const rawExpenditures = await DB.query.expenditures.findMany({
            where: and(...conditions),
            orderBy: [desc(schemas.expenditures.createdAt)],
            limit: limit + 1,
            with: {
                budgetCategory: true, // Ensure budgetCategory is loaded for the join and data
                budget: true,
            }
        });

        const paginatedResult = await withPagination<Expenditure>(
            rawExpenditures,
            limit,
            'createdAt'
        );

        return createActionResult(true, paginatedResult, undefined, "Expenditures by category fetched successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || 'Failed to fetch expenditures by category');
    }
}

/**
 * Fetches a paginated list of expenditures within a specific date range.
 *
 * @param {string} userId - The ID of the user.
 * @param {Date} startDate - The start date for the range.
 * @param {Date} endDate - The end date for the range.
 * @param {number} [limit=10] - The number of expenditures per page.
 * @param {string} [cursor] - The cursor for pagination.
 * @returns {Promise<ActionResult<PaginatedResult<Expenditure[]> | undefined>>} An action result containing a paginated list of expenditures, or an error.
 */
export async function getExpendituresByDateRangeAction( // Renamed to follow convention
    userId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10,
    cursor?: string
): Promise<ActionResult<PaginatedResult<Expenditure> | undefined>> {
    try {
        const conditions = [
            eq(schemas.expenditures.userId, userId),
            gte(schemas.expenditures.createdAt, startDate), // Use createdAt for filtering
            lte(schemas.expenditures.createdAt, endDate) // Use createdAt for filtering
        ];
        if (cursor) {
            conditions.push(lt(schemas.expenditures.createdAt, new Date(cursor)));
        }

        const rawExpenditures = await DB.query.expenditures.findMany({
            where: and(...conditions),
            orderBy: [desc(schemas.expenditures.createdAt)],
            limit: limit + 1,
            with: {
                budget: true,
                budgetCategory: true,
            }
        });

        const paginatedResult = await withPagination<Expenditure>(
            rawExpenditures,
            limit,
            'createdAt'
        );

        return createActionResult(true, paginatedResult, undefined, "Expenditures by date range fetched successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || 'Failed to fetch expenditures by date range');
    }
}

/**
 * Fetches a paginated list of recurring expenditures for a user.
 *
 * @param {string} userId - The ID of the user.
 * @param {number} [limit=10] - The number of expenditures per page.
 * @param {string} [cursor] - The cursor for pagination.
 * @returns {Promise<ActionResult<PaginatedResult<Expenditure[]> | undefined>>} An action result containing a paginated list of recurring expenditures, or an error.
 */
export async function getRecurringExpendituresAction( // Renamed to follow convention
    userId: string,
    limit: number = 10,
    cursor?: string
): Promise<ActionResult<PaginatedResult<Expenditure> | undefined>> {
    try {
        const conditions = [
            eq(schemas.expenditures.userId, userId),
            eq(schemas.expenditures.isRecurring, true), // Filter for recurring expenditures
            not(eq(schemas.expenditures.recurringSchedule, 'none')) // Ensure a schedule is set
        ];
        if (cursor) {
            conditions.push(lt(schemas.expenditures.createdAt, new Date(cursor)));
        }

        const rawExpenditures = await DB.query.expenditures.findMany({
            where: and(...conditions),
            orderBy: [desc(schemas.expenditures.nextDueDate), desc(schemas.expenditures.createdAt)], // Order by nextDueDate then createdAt
            limit: limit + 1,
            with: {
                budget: true,
                budgetCategory: true,
            }
        });

        const paginatedResult = await withPagination<Expenditure>(
            rawExpenditures,
            limit,
            'createdAt' // Still use createdAt for cursor unless nextDueDate is guaranteed unique and always present
        );

        return createActionResult(true, paginatedResult, undefined, "Recurring expenditures fetched successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || 'Failed to fetch recurring expenditures');
    }
}

/**
 * Retrieves aggregated analytics for a user's expenditures, including total expected,
 * total actual spent, and monthly/category breakdowns.
 *
 * @param {string} userId - The ID of the user.
 * @param {number} [year] - Optional year to filter analytics (defaults to current year).
 * @returns {Promise<ActionResult<{
 * totalExpectedExpenditure: string;
 * totalActualSpent: string;
 * monthlyExpenditureSummary: { month: string; totalSpent: string; }[];
 * expenditureByCategorySummary: { category: string; totalSpent: string; }[];
 * } | undefined>>}
 * Aggregated expenditure data.
 */
export async function getExpenditureAnalyticsAction(
    userId: string,
    year: number = new Date().getFullYear()
): Promise<ActionResult<{
    totalExpectedExpenditure: string;
    totalActualSpent: string;
    monthlyExpenditureSummary: { month: string; totalSpent: string; }[];
    expenditureByCategorySummary: { category: string; totalSpent: string; }[];
} | undefined>> {
    try {
        // 1. Total Expected Expenditure (from 'expenditures' table)
        const totalExpectedResult = await DB.select({
            total: sum(sql`${schemas.expenditures.expectedAmount}::numeric`),
        })
            .from(schemas.expenditures)
            .where(eq(schemas.expenditures.userId, userId));

        const totalExpectedExpenditure = parseFloat(totalExpectedResult[0]?.total || "0.00").toFixed(2);


        // 2. Total Actual Spent (from 'actualExpenditureRecords' table)
        const totalActualSpentResult = await DB.select({
            total: sum(sql`${schemas.actualExpenditureRecords.amount}::numeric`),
        })
            .from(schemas.actualExpenditureRecords)
            .where(eq(schemas.actualExpenditureRecords.userId, userId));

        const totalActualSpent = parseFloat(totalActualSpentResult[0]?.total || "0.00").toFixed(2);


        // 3. Monthly Expenditure Summary (from 'actualExpenditureRecords')
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year + 1, 0, 1);

        const monthlyExpenditureSummary = await DB.select({
            month: sql<string>`TO_CHAR(${schemas.actualExpenditureRecords.occurrenceDate}, 'YYYY-MM')`,
            totalSpent: sum(sql`${schemas.actualExpenditureRecords.amount}::numeric`),
        })
            .from(schemas.actualExpenditureRecords)
            .where(
                and(
                    eq(schemas.actualExpenditureRecords.userId, userId),
                    gte(schemas.actualExpenditureRecords.occurrenceDate, startDate),
                    lt(schemas.actualExpenditureRecords.occurrenceDate, endDate)
                )
            )
            .groupBy(sql`TO_CHAR(${schemas.actualExpenditureRecords.occurrenceDate}, 'YYYY-MM')`)
            .orderBy(sql`TO_CHAR(${schemas.actualExpenditureRecords.occurrenceDate}, 'YYYY-MM')`);

        const formattedMonthlySummary = monthlyExpenditureSummary.map(item => ({
            month: item.month,
            totalSpent: parseFloat(item.totalSpent || "0.00").toFixed(2),
        }));


        // 4. Expenditure by Category Summary (from 'actualExpenditureRecords' joined with 'budgetCategory')
        const expenditureByCategorySummary = await DB.select({
            category: schemas.budgetCategory.category,
            totalSpent: sum(sql`${schemas.actualExpenditureRecords.amount}::numeric`),
        })
            .from(schemas.actualExpenditureRecords)
            .leftJoin(
                schemas.budgetCategory,
                eq(schemas.actualExpenditureRecords.budgetCategoryId, schemas.budgetCategory.id)
            )
            .where(
                and(
                    eq(schemas.actualExpenditureRecords.userId, userId),
                    // Filter by year if desired, similar to monthly summary
                    gte(schemas.actualExpenditureRecords.occurrenceDate, startDate),
                    lt(schemas.actualExpenditureRecords.occurrenceDate, endDate)
                )
            )
            .groupBy(schemas.budgetCategory.category)
            .orderBy(schemas.budgetCategory.category);

        const formattedCategorySummary = expenditureByCategorySummary.map(item => ({
            category: item.category || 'Uncategorized', // Handle cases where budgetCategoryId might be null
            totalSpent: parseFloat(item.totalSpent || "0.00").toFixed(2),
        }));


        return createActionResult(true, {
            totalExpectedExpenditure,
            totalActualSpent,
            monthlyExpenditureSummary: formattedMonthlySummary,
            expenditureByCategorySummary: formattedCategorySummary,
        }, undefined, "Expenditure analytics retrieved successfully.");

    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || 'Failed to fetch expenditure analytics');
    }
}