"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { DB } from "@/db";
import { createActionResult } from "@/db/helpers/withPagination";
import schemas from "@/db/schemas";
import {
    ActionResult,
} from "@/types/db";
import { eq, sum, sql, and, gte, lt, notLike } from "drizzle-orm";

// Assuming these schemas are already defined and imported correctly in your schemas file
import { cards } from "@/db/schemas/cards";
import { loanRepayments, loanRequests } from "@/db/schemas/loans";
import { AnalyticTableRow } from "@/types/dashboard";

/**
 * Retrieves the total balance across all bank accounts for a given user with accurate trend data
 */
export async function getTotalUserBalanceAction(
    userId: string
): Promise<ActionResult<{
    totalBalance: string;
    trendPercentage: number;
    previousBalance: string;
    trendDirection: 'up' | 'down' | 'neutral';
} | undefined>> {
    try {
        // Current balance
        const currentResult = await DB.select({
            totalBalance: sum(schemas.bankAccounts.balance),
        })
            .from(schemas.bankAccounts)
            .where(and(
                eq(schemas.bankAccounts.userId, userId),
                notLike(schemas.bankAccounts.accountName, '%Loan Account%')
            ));

        // Previous month balance (using created_at instead of updated_at for more reliable history)
        const previousMonth = new Date();
        previousMonth.setMonth(previousMonth.getMonth() - 1);

        const previousResult = await DB.select({
            totalBalance: sum(schemas.bankAccounts.balance),
        })
            .from(schemas.bankAccounts)
            .where(
                and(
                    eq(schemas.bankAccounts.userId, userId),
                    lt(schemas.bankAccounts.createdAt, previousMonth)
                )
            );

        const currentBalance = parseFloat(currentResult[0]?.totalBalance || "0.00");
        const previousBalance = parseFloat(previousResult[0]?.totalBalance || "0.00");

        // Improved trend calculation with better edge case handling
        let trendPercentage = 0;
        let trendDirection: 'up' | 'down' | 'neutral' = 'neutral';

        if (previousBalance === 0) {
            if (currentBalance > 0) {
                trendPercentage = 100;
                trendDirection = 'up';
            } else if (currentBalance < 0) {
                trendPercentage = 100;
                trendDirection = 'down';
            }
            // else remains neutral (0%)
        } else {
            trendPercentage = ((currentBalance - previousBalance) / Math.abs(previousBalance)) * 100;
            trendDirection = currentBalance > previousBalance ? 'up' :
                currentBalance < previousBalance ? 'down' : 'neutral';
        }

        return createActionResult(true, {
            totalBalance: currentBalance.toFixed(2),
            trendPercentage: parseFloat(trendPercentage.toFixed(2)),
            previousBalance: previousBalance.toFixed(2),
            trendDirection
        });
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message);
    }
}

/**
 * Retrieves monthly income and expenses with trend data
 */
export async function getMonthlyIncomeExpensesAction(
    userId: string,
    month: number,
    year: number
): Promise<ActionResult<{
    totalMonthlyIncome: string;
    totalMonthlyExpenses: string;
    incomeTrendPercentage: number;
    expensesTrendPercentage: number;
    previousIncome: string;
    previousExpenses: string;
} | undefined>> {
    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 1);

        // Previous period (month)
        const prevStartDate = new Date(year, month - 2, 1);
        const prevEndDate = new Date(year, month - 1, 1);

        // Current period data
        const currentResult = await DB.select({
            totalIncome: sum(sql`CASE WHEN ${schemas.transactions.type} = 'deposit' THEN ${schemas.transactions.amount} ELSE 0 END`),
            totalExpenses: sum(sql`CASE WHEN ${schemas.transactions.type} IN ('purchase', 'withdrawal', 'fee', 'transfer') THEN ${schemas.transactions.amount} ELSE 0 END`),
        })
            .from(schemas.transactions)
            .where(
                and(
                    eq(schemas.transactions.userId, userId),
                    eq(schemas.transactions.status, 'completed'),
                    gte(schemas.transactions.createdAt, startDate),
                    lt(schemas.transactions.createdAt, endDate)
                )
            );

        // Previous period data
        const previousResult = await DB.select({
            totalIncome: sum(sql`CASE WHEN ${schemas.transactions.type} = 'deposit' THEN ${schemas.transactions.amount} ELSE 0 END`),
            totalExpenses: sum(sql`CASE WHEN ${schemas.transactions.type} IN ('purchase', 'withdrawal', 'fee', 'transfer') THEN ${schemas.transactions.amount} ELSE 0 END`),
        })
            .from(schemas.transactions)
            .where(
                and(
                    eq(schemas.transactions.userId, userId),
                    eq(schemas.transactions.status, 'completed'),
                    gte(schemas.transactions.createdAt, prevStartDate),
                    lt(schemas.transactions.createdAt, prevEndDate)
                )
            );

        const currentIncome = parseFloat(currentResult[0]?.totalIncome || "0.00");
        const currentExpenses = parseFloat(currentResult[0]?.totalExpenses || "0.00");
        const previousIncome = parseFloat(previousResult[0]?.totalIncome || "0.00");
        const previousExpenses = parseFloat(previousResult[0]?.totalExpenses || "0.00");

        const incomeTrend = previousIncome !== 0
            ? ((currentIncome - previousIncome) / previousIncome) * 100
            : currentIncome > 0 ? 100 : 0;

        const expensesTrend = previousExpenses !== 0
            ? ((currentExpenses - previousExpenses) / previousExpenses) * 100
            : currentExpenses > 0 ? 100 : 0;

        return createActionResult(true, {
            totalMonthlyIncome: currentIncome.toFixed(2),
            totalMonthlyExpenses: currentExpenses.toFixed(2),
            incomeTrendPercentage: parseFloat(incomeTrend.toFixed(2)),
            expensesTrendPercentage: parseFloat(expensesTrend.toFixed(2)),
            previousIncome: previousIncome.toFixed(2),
            previousExpenses: previousExpenses.toFixed(2)
        });
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message);
    }
}

/**
 * Enhanced savings rate calculation with trend data
 */
export async function getSavingsRateAction(
    userId: string,
    startDate: Date,
    endDate: Date
): Promise<ActionResult<{
    savingsRatePercentage: number;
    trendPercentage: number;
    previousRate: number;
    totalDeposits: string;
    totalIncome: string;
} | undefined>> {
    try {
        // Current period
        const currentData = await DB.select({
            totalDeposits: sum(sql`CASE WHEN ${schemas.transactions.type} = 'deposit' THEN ${schemas.transactions.amount} ELSE 0 END`),
            totalIncome: sum(sql`CASE WHEN ${schemas.transactions.type} IN ('deposit', 'income') THEN ${schemas.transactions.amount} ELSE 0 END`),
        })
            .from(schemas.transactions)
            .where(
                and(
                    eq(schemas.transactions.userId, userId),
                    eq(schemas.transactions.status, 'completed'),
                    gte(schemas.transactions.createdAt, startDate),
                    lt(schemas.transactions.createdAt, endDate)
                )
            );

        // Previous period (same length as current period)
        const prevStartDate = new Date(startDate);
        prevStartDate.setMonth(prevStartDate.getMonth() - 1);
        const prevEndDate = new Date(endDate);
        prevEndDate.setMonth(prevEndDate.getMonth() - 1);

        const previousData = await DB.select({
            totalDeposits: sum(sql`CASE WHEN ${schemas.transactions.type} = 'deposit' THEN ${schemas.transactions.amount} ELSE 0 END`),
            totalIncome: sum(sql`CASE WHEN ${schemas.transactions.type} IN ('deposit', 'income') THEN ${schemas.transactions.amount} ELSE 0 END`),
        })
            .from(schemas.transactions)
            .where(
                and(
                    eq(schemas.transactions.userId, userId),
                    eq(schemas.transactions.status, 'completed'),
                    gte(schemas.transactions.createdAt, prevStartDate),
                    lt(schemas.transactions.createdAt, prevEndDate)
                )
            );

        const currentDeposits = parseFloat(currentData[0]?.totalDeposits || "0.00");
        const currentIncome = parseFloat(currentData[0]?.totalIncome || "0.00");
        const previousDeposits = parseFloat(previousData[0]?.totalDeposits || "0.00");
        const previousIncome = parseFloat(previousData[0]?.totalIncome || "0.00");

        const currentRate = currentIncome > 0 ? (currentDeposits / currentIncome) * 100 : 0;
        const previousRate = previousIncome > 0 ? (previousDeposits / previousIncome) * 100 : 0;

        const trendPercentage = previousRate !== 0
            ? ((currentRate - previousRate) / previousRate) * 100
            : currentRate > 0 ? 100 : 0;

        return createActionResult(true, {
            savingsRatePercentage: parseFloat(currentRate.toFixed(2)),
            trendPercentage: parseFloat(trendPercentage.toFixed(2)),
            previousRate: parseFloat(previousRate.toFixed(2)),
            totalDeposits: currentDeposits.toFixed(2),
            totalIncome: currentIncome.toFixed(2)
        });
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message);
    }
}

/**
 * Loan summary with trend data
 */
export async function getLoanSummaryAction(
    userId: string
): Promise<ActionResult<{
    totalLoanRequested: string;
    totalLoanPaidBack: string;
    totalLoanRemaining: string;
    repaymentTrendPercentage: number;
} | undefined>> {
    try {
        // Current loan data
        const [totalRequestedResult, totalPaidBackResult] = await Promise.all([
            DB.select({ amount: sum(loanRequests.amountRequested) })
                .from(loanRequests)
                .where(eq(loanRequests.userId, userId)),

            DB.select({ amount: sum(loanRepayments.amount) })
                .from(loanRepayments)
                .where(eq(loanRepayments.userId, userId))
        ]);

        // Previous month's repayment data for trend
        const prevMonthPaidBack = await DB.select({
            amount: sum(loanRepayments.amount)
        })
            .from(loanRepayments)
            .where(
                and(
                    eq(loanRepayments.userId, userId),
                    lt(loanRepayments.createdAt, new Date(new Date().setMonth(new Date().getMonth() - 1)))
                )
            );

        const requested = parseFloat(totalRequestedResult[0]?.amount || "0.00");
        const paidBack = parseFloat(totalPaidBackResult[0]?.amount || "0.00");
        const prevPaidBack = parseFloat(prevMonthPaidBack[0]?.amount || "0.00");
        const remaining = requested - paidBack;

        // Calculate repayment trend (how much more/less was paid this month)
        const repaymentTrend = prevPaidBack !== 0
            ? ((paidBack - prevPaidBack) / prevPaidBack) * 100
            : paidBack > 0 ? 100 : 0;

        return createActionResult(true, {
            totalLoanRequested: requested.toFixed(2),
            totalLoanPaidBack: paidBack.toFixed(2),
            totalLoanRemaining: remaining.toFixed(2),
            repaymentTrendPercentage: parseFloat(repaymentTrend.toFixed(2))
        });
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message);
    }
}


/**
 * Retrieves an overview of card usage, including total amount left (from linked bank account),
 * total spent, and percentages, aggregated by week, month, or year from card creation.
 *
 * @param {string} userId - The ID of the user.
 * @param {string} cardId - The ID of the specific card.
 * @param {'week' | 'month' | 'year'} period - The aggregation period.
 * @returns {Promise<ActionResult<{
 * totalAmountLeft: string; // Balance from the linked bank account
 * totalAmountSpent: string;
 * percentageDeduction: number;
 * totalAmountGained: string;
 * percentageGain: number;
 * periodLabel: string; // e.g., "Week 1", "January", "2023"
 * }[] | undefined>>}
 * Aggregated card data for the specified period.
 */
export async function getCardOverviewAction(
    userId: string,
    cardId: string,
    period: 'week' | 'month' | 'year'
): Promise<ActionResult<{
    totalAmountLeft: string;
    totalAmountSpent: string;
    percentageDeduction: number;
    totalAmountGained: string;
    percentageGain: number;
    periodLabel: string;
}[] | undefined>> {
    try {
        // First, get the card's creation date and its linked bank account ID
        const cardData = await DB.query.cards.findFirst({
            where: and(eq(cards.id, cardId), eq(cards.userId, userId)),
            columns: {
                createdAt: true,
                accountId: true, // Assuming cards schema has accountId
            }
        });

        if (!cardData) {
            return createActionResult<undefined>(false, undefined, "NotFound", "Card not found or does not belong to user.");
        }

        const cardCreationDate = cardData.createdAt;
        let currentCardLinkedBalance = "0.00"; // Default to 0

        // If the card is linked to a bank account, fetch its current balance
        if (cardData.accountId) {
            const linkedAccount = await DB.query.bankAccounts.findFirst({
                where: eq(schemas.bankAccounts.id, cardData.accountId),
                columns: {
                    balance: true,
                }
            });
            if (linkedAccount) {
                currentCardLinkedBalance = parseFloat(linkedAccount.balance || "0.00").toFixed(2);
            }
        } else {
            // Handle case where card has no linked account or is a standalone type
            // You might choose to set totalAmountLeft to "N/A" or "0.00"
            // Or if it's a prepaid card, you might need a 'currentBalance' field directly on 'cards'
            console.warn(`Card ${cardId} has no linked account. 'totalAmountLeft' will be 0.00.`);
        }

        let groupByExpression: any; // Type for Drizzle SQL expression

        switch (period) {
            case 'week':
                groupByExpression = sql`TO_CHAR(${schemas.transactions.createdAt}, 'YYYY-IW')`;
                break;
            case 'month':
                groupByExpression = sql`TO_CHAR(${schemas.transactions.createdAt}, 'YYYY-MM')`;
                break;
            case 'year':
                groupByExpression = sql`TO_CHAR(${schemas.transactions.createdAt}, 'YYYY')`;
                break;
            default:
                return createActionResult<undefined>(false, undefined, "InvalidInput", "Invalid period specified. Must be 'week', 'month', or 'year'.");
        }

        // Fetch transactions related to this card since its creation
        const cardTransactionsSummary = await DB.select({
            periodLabel: groupByExpression,
            totalSpent: sum(sql`CASE WHEN ${schemas.transactions.type} IN ('purchase', 'withdrawal', 'transfer', 'fee') THEN ${schemas.transactions.amount}::numeric ELSE 0 END`),
            totalGained: sum(sql`CASE WHEN ${schemas.transactions.type} = 'deposit' THEN ${schemas.transactions.amount}::numeric ELSE 0 END`),
        })
            .from(schemas.transactions)
            .where(
                and(
                    eq(schemas.transactions.userId, userId),
                    eq(schemas.transactions.status, 'completed'),
                    gte(schemas.transactions.createdAt, cardCreationDate)
                )
            )
            .groupBy(groupByExpression)
            .orderBy(groupByExpression);

        const aggregatedResults: {
            totalAmountLeft: string;
            totalAmountSpent: string;
            percentageDeduction: number;
            totalAmountGained: string;
            percentageGain: number;
            periodLabel: string;
        }[] = [];

        for (const summary of cardTransactionsSummary) {
            const totalSpent = parseFloat(summary.totalSpent || "0.00");
            const totalGained = parseFloat(summary.totalGained || "0.00");

            let percentageDeduction = 0;
            let percentageGain = 0;

            const totalTransactionsForPeriod = totalSpent + totalGained;
            if (totalTransactionsForPeriod > 0) {
                percentageDeduction = (totalSpent / totalTransactionsForPeriod) * 100;
                percentageGain = (totalGained / totalTransactionsForPeriod) * 100;
            }

            aggregatedResults.push({
                totalAmountLeft: currentCardLinkedBalance, // This now reflects the linked bank account's balance
                totalAmountSpent: totalSpent.toFixed(2),
                percentageDeduction: parseFloat(percentageDeduction.toFixed(2)),
                totalAmountGained: totalGained.toFixed(2),
                percentageGain: parseFloat(percentageGain.toFixed(2)),
                periodLabel: summary.periodLabel,
            });
        }

        return createActionResult(true, aggregatedResults, undefined, "Card overview retrieved successfully.");

    } catch (error: any) {
        const err = new Error(error.message || 'Failed to retrieve card overview');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Fetches various analytics summaries and formats them for the data table.
 * @param userId The ID of the user.
 * @returns A promise that resolves to an ActionResult containing an array of AnalyticTableRow data.
 */
export async function getAnalyticTableDataAction(
    userId: string
): Promise<ActionResult<AnalyticTableRow[]>> {
    try {
        const data: AnalyticTableRow[] = [];

        // --- 1. Get Total User Balance ---
        const balanceResult = await getTotalUserBalanceAction(userId);
        if (balanceResult.success && balanceResult.data) {
            data.push({
                id: "total-balance",
                header: "Total Balance",
                value: `$${parseFloat(balanceResult.data.totalBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                description: "Aggregated balance across all bank accounts.",
                status: parseFloat(balanceResult.data.totalBalance) > 0 ? "good" : "warning", // Example status logic
                trend: undefined, // No direct trend from this action
            });
        } else {
            data.push({
                id: "total-balance",
                header: "Total Balance",
                value: "N/A",
                description: balanceResult.error || "Could not load total balance.",
                status: "critical",
                trend: undefined,
            });
        }

        // --- 2. Get Monthly Income and Expenses for Current Month ---
        const currentMonth = new Date().getMonth() + 1; // getMonth() is 0-indexed
        const currentYear = new Date().getFullYear();
        const monthlyResult = await getMonthlyIncomeExpensesAction(
            userId,
            currentMonth,
            currentYear
        );

        if (monthlyResult.success && monthlyResult.data) {
            const income = parseFloat(monthlyResult.data.totalMonthlyIncome);
            const expenses = parseFloat(monthlyResult.data.totalMonthlyExpenses);

            data.push({
                id: "monthly-income",
                header: `Income (${new Date().toLocaleString('default', { month: 'short' })})`,
                value: `$${income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                description: `Total income for ${new Date().toLocaleString('default', { month: 'long' })}.`,
                status: income > 0 ? "good" : "info",
                trend: undefined, // Add trend logic if you have historical monthly data
            });
            data.push({
                id: "monthly-expenses",
                header: `Expenses (${new Date().toLocaleString('default', { month: 'short' })})`,
                value: `$${expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                description: `Total expenses for ${new Date().toLocaleString('default', { month: 'long' })}.`,
                status: expenses > 0 ? "warning" : "good", // Example: expenses are usually a warning
                trend: undefined,
            });
        } else {
            data.push({
                id: "monthly-income",
                header: "Monthly Income",
                value: "N/A",
                description: monthlyResult.error || "Could not load monthly income.",
                status: "critical",
                trend: undefined,
            });
            data.push({
                id: "monthly-expenses",
                header: "Monthly Expenses",
                value: "N/A",
                description: monthlyResult.error || "Could not load monthly expenses.",
                status: "critical",
                trend: undefined,
            });
        }

        // --- 3. Get Loan Summary ---
        const loanResult = await getLoanSummaryAction(userId);
        if (loanResult.success && loanResult.data) {
            const requested = parseFloat(loanResult.data.totalLoanRequested);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const paidBack = parseFloat(loanResult.data.totalLoanPaidBack);
            const remaining = parseFloat(loanResult.data.totalLoanRemaining);

            data.push({
                id: "loan-requested",
                header: "Loan Requested",
                value: `$${requested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                description: "Total amount requested across all loans.",
                status: requested > 0 ? "info" : "good",
                trend: undefined,
            });
            data.push({
                id: "loan-remaining",
                header: "Loan Remaining",
                value: `$${remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                description: "Outstanding loan amount to be repaid.",
                status: remaining > 0 ? "critical" : "good",
                trend: undefined,
            });
        } else {
            data.push({
                id: "loan-summary",
                header: "Loan Summary",
                value: "N/A",
                description: loanResult.error || "Could not load loan summary.",
                status: "critical",
                trend: undefined,
            });
        }

        return createActionResult(true, data, undefined, "Analytic table data retrieved successfully.");
    } catch (error: any) {
        const err = new Error(error.message || "Failed to retrieve analytic table data");
        return createActionResult<AnalyticTableRow[]>(false, [], err.name || "ServerError", err.message);
    }
}

export async function analyticAction(timeRange: '7d' | '30d' | '3m' | '1yr', userId: string) {
    try {

        const today = new Date();
        let startDate: Date;

        const endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999); // End of today

        switch (timeRange) {
            case '7d':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 6); // 7 days including today
                break;
            case '30d':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 29); // 30 days including today
                break;
            case '3m':
                startDate = new Date(today);
                startDate.setMonth(today.getMonth() - 3); // 3 months ago
                startDate.setDate(1); // Start of that month
                break;
            case '1yr':
                startDate = new Date(today);
                startDate.setFullYear(today.getFullYear() - 1); // 1 year ago
                startDate.setDate(1); // Start of that month
                break;
            default:
                throw new Error("Invalid timeRange provided. Accepted values are '7d', '30d', '3m', '1yr'.");
        }

        startDate.setHours(0, 0, 0, 0); // Start of the day for startDate

        // Determine the grouping based on time range
        const isDailyRange = timeRange === '7d' || timeRange === '30d';
        const groupByFormat = isDailyRange ? 'YYYY-MM-DD' : 'YYYY-MM';
        const dateField = isDailyRange ? 'transactionDate' : 'monthYear';

        const query = DB.select({
            [dateField]: sql`TO_CHAR(${schemas.transactions.createdAt}, '${sql.raw(groupByFormat)}') AS ${sql.raw(dateField)}`,
            totalIncome: sum(sql`CASE WHEN ${schemas.transactions.type} = 'deposit' THEN ${schemas.transactions.amount}::numeric ELSE 0 END`),
            totalExpenses: sum(sql`CASE WHEN ${schemas.transactions.type} IN ('purchase', 'withdrawal', 'fee', 'transfer') THEN ${schemas.transactions.amount}::numeric ELSE 0 END`),
        })
            .from(schemas.transactions)
            .where(
                and(
                    eq(schemas.transactions.userId, userId),
                    eq(schemas.transactions.status, 'completed'),
                    gte(schemas.transactions.createdAt, startDate),
                    lt(schemas.transactions.createdAt, endDate)
                )
            )
            .groupBy(sql`TO_CHAR(${schemas.transactions.createdAt}, '${sql.raw(groupByFormat)}')`)
            .orderBy(sql`TO_CHAR(${schemas.transactions.createdAt}, '${sql.raw(groupByFormat)}')`);

        const result = await query;

        // Prepare a full list of dates/months for the given range to ensure continuity
        const fullRangeData: { date: string; income: number; expenses: number }[] = [];
        const currentIterator = new Date(startDate);

        while (currentIterator <= endDate) {
            const year = currentIterator.getFullYear();
            const month = (currentIterator.getMonth() + 1).toString().padStart(2, '0');
            const day = currentIterator.getDate().toString().padStart(2, '0');

            // Format the date key based on the time range
            const dateKey = isDailyRange
                ? `${year}-${month}-${day}`
                : `${year}-${month}`;

            // Find matching data from the query results
            const existingData = result.find(d =>
                d[dateField as keyof typeof d] === dateKey
            );

            fullRangeData.push({
                date: dateKey,
                income: parseFloat(existingData?.totalIncome as string || "0"),
                expenses: parseFloat(existingData?.totalExpenses as string || "0"),
            });

            // Increment based on time range
            if (isDailyRange) {
                currentIterator.setDate(currentIterator.getDate() + 1);
            } else {
                currentIterator.setMonth(currentIterator.getMonth() + 1);
            }
        }

        return fullRangeData;

    } catch (error: any) {
        throw new Error(error.message || "Failed to retrieve income/expense analytics data.");
    }
}