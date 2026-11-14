// src/app/api/actions/loans.ts
'use server';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { DB } from "@/db";
import { createActionResult, withPagination } from "@/db/helpers/withPagination";
import schemas from "@/db/schemas";
import { generateBankAccountNumber } from "@/lib/constants";
import {
    ActionResult,
    PaginatedResult,
    LoanRequest,
    NewLoanRequest,
    UpdateLoanRequest,
    LoanApproval,
    NewLoanApproval,
    LoanRepayment,
    NewLoanRepayment,
    Transaction,
    NewTransaction,
    LoanRequestStatusEnum,
    EnrichedLoanRequest,
    BankAccount,
} from "@/types/db"; // Ensure all types are correctly imported
import { eq, and, desc, lt, sum, sql, gte, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, addMonths, isPast } from 'date-fns'; // Added date-fns
import { LoanrequestWithRelationships } from "@/db/schemas/loans";

// --- Helper for recording transactions (re-used from budget actions) ---
async function recordTransaction(
    transactionData: NewTransaction
): Promise<Transaction> {
    try {
        console.log(transactionData)
        const [transaction] = await DB
            .insert(schemas.transactions)
            .values(transactionData)
            .returning();

        console.log(transaction)
        if (!transaction) {
            throw new Error("Failed to record transaction.");
        }
        return transaction;
    } catch (error: any) {
        throw new Error(`Failed to create transactions duee to these reasons: ${error}`)
    }
}

// --- Loan Request Actions ---

/**
 * Creates a new loan request.
 *
 * @param {string} userId - The ID of the user making the request.
 * @param {Omit<NewLoanRequest, 'userId'>} requestData - The data for the new loan request.
 * @returns {Promise<ActionResult<LoanRequest | undefined>>} An action result containing the created loan request, or an error.
 */
export async function createLoanRequestAction(
    userId: string,
    requestData: Omit<NewLoanRequest, 'userId'>
): Promise<ActionResult<LoanRequest | undefined>> {
    try {
        // --- Rule 1: Check for any active or pending loans ---
        const activeOrPendingLoans = await DB.query.loanRequests.findFirst({
            where: and(
                eq(schemas.loanRequests.userId, userId),
                inArray(schemas.loanRequests.status, ['pending', 'approved', 'disbursed'])
            ),
        });

        if (activeOrPendingLoans) {
            return createActionResult<undefined>(
                false,
                undefined,
                "ActiveLoanExists",
                "You already have an active loan or a pending loan request. Only one active loan is allowed at a time."
            );
        }

        // --- Rule 2: Check for recently completed loans (within the last 6 months) ---
        const latestCompletedLoan = await DB.query.loanRequests.findFirst({
            where: and(
                eq(schemas.loanRequests.userId, userId),
                eq(schemas.loanRequests.status, 'completed')
            ),
            orderBy: [desc(schemas.loanRequests.updatedAt)], // Assuming updatedAt reflects completion date
        });

        if (latestCompletedLoan) {
            const sixMonthsAgo = subMonths(new Date(), 6);
            if (latestCompletedLoan.updatedAt && latestCompletedLoan.updatedAt > sixMonthsAgo) {
                return createActionResult<undefined>(
                    false,
                    undefined,
                    "CoolDownPeriodActive",
                    "You can request a new loan only 6 months after your last loan was completed."
                );
            }
        }

        const [newRequest] = await DB.insert(schemas.loanRequests)
            .values({
                ...requestData,
                userId,
                status: 'pending', // Ensure initial status is pending
            })
            .returning();

        if (!newRequest) {
            return createActionResult<undefined>(false, undefined, "CreationFailed", "Failed to create loan request.");
        }

        revalidatePath('/dashboard/loans');
        revalidatePath('/dashboard/financing'); // If loans are part of financing overview
        return createActionResult(true, newRequest, undefined, "Loan request created successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || 'Failed to create loan request');
    }
}

/**
 * Updates an existing loan request.
 *
 * @param {string} requestId - The ID of the loan request to update.
 * @param {string} userId - The ID of the user who owns the request (for authorization).
 * @param {UpdateLoanRequest} updateData - Partial data to update the loan request.
 * @returns {Promise<ActionResult<LoanRequest | undefined>>} An action result containing the updated loan request, or an error.
 */
export async function updateLoanRequestAction(
    requestId: string,
    userId: string,
    updateData: UpdateLoanRequest
): Promise<ActionResult<LoanRequest | undefined>> {
    try {
        const [updatedRequest] = await DB.update(schemas.loanRequests)
            .set(updateData)
            .where(and(
                eq(schemas.loanRequests.id, requestId),
                eq(schemas.loanRequests.userId, userId),
                eq(schemas.loanRequests.status, "pending")
            ))
            .returning();

        if (!updatedRequest) {
            return createActionResult<undefined>(false, undefined, "NotFound", "Loan request not found or not owned by user.");
        }

        revalidatePath('/dashboard/loans');
        revalidatePath(`/dashboard/loans/${requestId}`);
        return createActionResult(true, updatedRequest, undefined, "Loan request updated successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || 'Failed to update loan request');
    }
}

/**
 * Cancels a pending loan request.
 *
 * @param {string} requestId - The ID of the loan request to cancel.
 * @param {string} userId - The ID of the user who owns the request (for authorization).
 * @returns {Promise<ActionResult<{ id: string } | undefined>>} An action result indicating success or failure.
 */
export async function cancelLoanRequestAction(
    requestId: string,
    userId: string
): Promise<ActionResult<{ id: string } | undefined>> {
    try {
        const [cancelledRequest] = await DB.update(schemas.loanRequests)
            .set({ status: 'cancelled' })
            .where(and(
                eq(schemas.loanRequests.id, requestId),
                eq(schemas.loanRequests.userId, userId),
                eq(schemas.loanRequests.status, 'pending') // Only cancel pending requests
            ))
            .returning({ id: schemas.loanRequests.id });

        if (!cancelledRequest) {
            return createActionResult<undefined>(false, undefined, "NotFound", "Loan request not found, not owned by user, or not in 'pending' status.");
        }

        revalidatePath('/dashboard/loans');
        revalidatePath(`/dashboard/loans/${requestId}`);
        return createActionResult(true, cancelledRequest, undefined, "Loan request cancelled successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || 'Failed to cancel loan request');
    }
}

/**
 * Retrieves a specific loan request by ID, including its approval details if available.
 *
 * @param {string} requestId - The ID of the loan request.
 * @param {string} userId - The ID of the user who owns the request (for authorization).
 * @returns {Promise<ActionResult<LoanRequest & { approval?: LoanApproval } | undefined>>} An action result containing the loan request with approval, or an error.
 */
export async function getLoanRequestByIdAction(
    requestId: string,
    userId: string
): Promise<ActionResult<(LoanRequest & { approval: LoanApproval | null }) | undefined>> {
    try {
        const loanRequest = await DB.query.loanRequests.findFirst({
            where: and(
                eq(schemas.loanRequests.id, requestId),
                eq(schemas.loanRequests.userId, userId)
            ),
            with: {
                approval: true, // Eagerly load approval details
            }
        });

        if (!loanRequest) {
            return createActionResult<undefined>(false, undefined, "NotFound", "Loan request not found or not owned by user.");
        }

        return createActionResult<(LoanRequest & { approval: LoanApproval | null })>(true, loanRequest, undefined, "Loan request retrieved successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || 'Failed to fetch loan request');
    }
}

/**
 * Retrieves a paginated list of loan requests for a specific user, enriched with approval and repayment data.
 *
 * @param {string} userId - The ID of the user.
 * @param {LoanRequestStatusEnum} [status] - Optional: Filter by loan request status.
 * @param {number} [limit=10] - The number of requests per page.
 * @param {string} [cursor] - The cursor for pagination (createdAt timestamp).
 * @returns {Promise<ActionResult<PaginatedResult<EnrichedLoanRequest> | undefined>>} A paginated list of loan requests.
 */
export async function getUserLoanRequestsAction(
    userId: string,
    status?: LoanRequestStatusEnum,
    limit: number = 10,
    cursor?: string | null
): Promise<ActionResult<PaginatedResult<EnrichedLoanRequest> | undefined>> {
    try {
        const conditions = [eq(schemas.loanRequests.userId, userId)];
        if (status) {
            conditions.push(eq(schemas.loanRequests.status, status));
        }
        if (cursor) {
            conditions.push(lt(schemas.loanRequests.createdAt, new Date(cursor)));
        }

        const rawRequests = await DB.query.loanRequests.findMany({
            where: and(...conditions),
            orderBy: [desc(schemas.loanRequests.createdAt)],
            limit: limit + 1,
            with: {
                approval: {
                    with: {
                        repayments: true // Include repayments to calculate paid amount
                    }
                },
            }
        });

        const enrichedRequests: EnrichedLoanRequest[] = rawRequests.map(request => {
            let approvedAmount: number | null = null;
            let paidAmount: number | null = null;
            let remainingAmount: number | null = null;
            let progressPercentage: number | null = null;
            let isOverdue: boolean | null = null;
            let repaymentEndDate: Date | null = null;

            if (request.approval) {
                approvedAmount = parseFloat(request.approval.approvedAmount);
                remainingAmount = parseFloat(request.approval.outstandingPrincipal);

                // Calculate paid amount
                paidAmount = request.approval.repayments.reduce((sum, repayment) => {
                    return sum + parseFloat(repayment.amount);
                }, 0);

                // Calculate progress percentage
                if (approvedAmount > 0) {
                    progressPercentage = (paidAmount / approvedAmount) * 100;
                } else {
                    progressPercentage = 0; // If no approved amount, progress is 0
                }

                // Determine if overdue
                if (request.status === 'disbursed' || request.status === 'approved') {
                    if (request.approval.repaymentStartDate && request.tenureMonths) {
                        const tenureMonths = parseFloat(request.tenureMonths);
                        repaymentEndDate = addMonths(request.approval.repaymentStartDate, tenureMonths);
                        if (isPast(repaymentEndDate) && remainingAmount > 0) {
                            isOverdue = true;
                        } else {
                            isOverdue = false;
                        }
                    }
                } else if (request.status === 'completed') {
                    isOverdue = false; // Completed loans are not overdue
                    remainingAmount = 0; // Ensure remaining is 0 for completed loans
                    progressPercentage = 100; // Ensure progress is 100 for completed loans
                } else {
                    isOverdue = null; // Not applicable for pending/rejected/cancelled
                }
            } else if (request.status === 'pending') {
                // For pending loans without approval, these fields are not applicable or 0
                approvedAmount = parseFloat(request.amountRequested);
                paidAmount = 0;
                remainingAmount = parseFloat(request.amountRequested);
                progressPercentage = 0;
                isOverdue = false; // A pending loan is not overdue
            }


            return {
                ...request,
                approvedAmount,
                paidAmount,
                remainingAmount,
                progressPercentage: progressPercentage !== null ? Math.min(100, progressPercentage) : null, // Cap at 100%
                isOverdue,
                repaymentEndDate
            };
        });

        const paginatedResult = await withPagination<EnrichedLoanRequest>(
            enrichedRequests,
            limit,
            'createdAt'
        );

        return createActionResult(true, paginatedResult, undefined, "User loan requests fetched successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || 'Failed to fetch user loan requests');
    }
}

/**
 * Retrieves a paginated list of all loan requests (for admin use only).
 *
 * @param {string} adminUserId - The ID of the admin user performing the action (for authorization).
 * @param {LoanRequestStatusEnum} [status] - Optional: Filter by loan request status.
 * @param {string} [filterByUserId] - Optional: Filter requests by a specific user ID.
 * @param {number} [limit=10] - The number of requests per page.
 * @param {string} [cursor] - The cursor for pagination.
 * @returns {Promise<ActionResult<PaginatedResult<LoanRequest> | undefined>>} A paginated list of all loan requests.
 */
export async function getAllLoanRequestsAdminAction(
    adminUserId: string, // For admin authorization
    status?: LoanRequestStatusEnum,
    filterByUserId?: string,
    limit: number = 10,
    cursor?: string
): Promise<ActionResult<PaginatedResult<LoanrequestWithRelationships> | undefined>> {
    try {
        // --- Admin Privilege Check (Placeholder - Implement your actual logic) ---
        const adminUser = await DB.query.user.findFirst({ where: eq(schemas.user.id, adminUserId) });
        if (!adminUser || !adminUser.admin) { // Assuming 'admin' boolean field on user schema
            return createActionResult<undefined>(false, undefined, "Unauthorized", "You do not have administrative privileges to view all loan requests.");
        }
        // --- End Admin Privilege Check ---

        const conditions: any[] = [];
        if (status) {
            conditions.push(eq(schemas.loanRequests.status, status));
        }
        if (filterByUserId) {
            conditions.push(eq(schemas.loanRequests.userId, filterByUserId));
        }
        if (cursor) {
            conditions.push(lt(schemas.loanRequests.createdAt, new Date(cursor)));
        }

        const rawRequests = await DB.query.loanRequests.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            orderBy: [desc(schemas.loanRequests.createdAt)],
            limit: limit + 1,
            with: {
                user: true,
                approval: true, // Include approval status
            }
        });

        const paginatedResult = await withPagination<LoanrequestWithRelationships>(
            rawRequests,
            limit,
            'createdAt'
        );

        return createActionResult(true, paginatedResult, undefined, "All loan requests fetched successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || 'Failed to fetch all loan requests');
    }
}

// --- Loan Approval Actions ---

/**
 * Approves a loan request, creates a new loan tracking account, records disbursement,
 * and updates loan request status. This is a complex transactional operation.
 *
 * @param {string} loanRequestId - The ID of the loan request to approve.
 * @param {string} approvedByUserId - The ID of the admin user approving the loan.
 * @param {Omit<NewLoanApproval, 'loanRequestId' | 'approvedByUserId' | 'disbursementTransactionId' | 'loanAccountId' | 'outstandingPrincipal' | 'totalRepayableAmount'>} approvalData - Data for the loan approval.
 * @param {string} disbursementAccountId - The user's bank account ID where funds will be disbursed.
 * @returns {Promise<ActionResult<LoanApproval | undefined>>} An action result containing the created loan approval, or an error.
 */
export async function approveLoanAction(
    loanRequestId: string,
    approvedByUserId: string,
    approvalData: Omit<NewLoanApproval, 'loanRequestId' | 'approvedByUserId' | 'disbursementTransactionId' | 'loanAccountId' | 'outstandingPrincipal' | 'totalRepayableAmount' | 'repaymentStartDate'>,
    disbursementAccountId: string
): Promise<ActionResult<LoanApproval | undefined>> {
    try {
        // --- Admin Privilege Check (Placeholder) ---
        const adminUser = await DB.query.user.findFirst({ where: eq(schemas.user.id, approvedByUserId) });
        if (!adminUser || !adminUser.admin) {
            return createActionResult<undefined>(false, undefined, "Unauthorized", "You do not have administrative privileges to approve loans.");
        }
        // --- End Admin Privilege Check ---

        const result = await DB.transaction(async (tx) => {
            // 1. Fetch the loan request and user
            const loanRequest = await tx.query.loanRequests.findFirst({
                where: eq(schemas.loanRequests.id, loanRequestId),
                with: { user: true } // Eager load user to get userId for transaction
            });

            if (!loanRequest || loanRequest.status !== 'pending') {
                throw new Error("Loan request not found or not in 'pending' status.");
            }

            const borrowerUserId = loanRequest.userId;

            // 2. Verify disbursement account exists and belongs to the borrower
            const targetAccount = await tx.query.bankAccounts.findFirst({
                where: and(
                    eq(schemas.bankAccounts.id, disbursementAccountId),
                    eq(schemas.bankAccounts.userId, borrowerUserId),
                    eq(schemas.bankAccounts.accountName, `Loan Account for ${loanRequest.user.name}`)
                )
            });

            // if (!targetAccount) {
            //     throw new Error("Disbursement bank account not found or does not belong to the borrower.");
            // }

            // 3. Calculate total repayable amount (simplified for example)
            // A real system would use a proper amortization schedule
            const approvedAmountNum = parseFloat(approvalData.approvedAmount);
            const interestRateNum = parseFloat(approvalData.interestRate); // Annual rate
            const tenureMonthsNum = parseFloat(loanRequest.tenureMonths);

            if (isNaN(approvedAmountNum) || isNaN(interestRateNum) || isNaN(tenureMonthsNum)) {
                throw new Error("Invalid numeric values for loan calculation.");
            }

            const monthlyInterestRate = (interestRateNum / 100) / 12;
            let totalRepayableAmountNum = approvedAmountNum; // Start with principal

            // Simple interest calculation for total repayable (for demonstration)
            // For compound interest/amortization, use a financial library
            totalRepayableAmountNum += (approvedAmountNum * monthlyInterestRate * tenureMonthsNum);

            console.log("TTL_REPA:: ", totalRepayableAmountNum)
            // 4. Create a dedicated 'loan_account' in bankAccounts for tracking this loan
            const newAccountNumber = await generateBankAccountNumber("loan_account");

            const upreferences = await tx.query.preferences.findFirst({
                where: eq(schemas.preferences.userId, borrowerUserId)
            })

            if (!upreferences) {
                throw new Error("User Preferences are missing");
            }

            let loanTrackingAccount: BankAccount | undefined = undefined;

            if (!targetAccount) {
                [loanTrackingAccount] = await tx.insert(schemas.bankAccounts)
                    .values({
                        userId: borrowerUserId,
                        accountNumber: newAccountNumber,
                        accountName: `Loan Account for ${loanRequest.user.name}`,
                        accountType: "loan_account",
                        currency: upreferences?.currency || "USD",
                        balance: `-${approvedAmountNum.toFixed(2)}`, // Initial balance is negative (debt)
                        status: 'active',
                    })
                    .returning();
            } else {
                loanTrackingAccount = targetAccount;
            }

            if (!loanTrackingAccount) {
                throw new Error("Failed to create loan tracking account.");
            }

            console.log(loanTrackingAccount.balance)

            // 5. Record the disbursement transaction
            console.log("Recording the disbursed transactions")
            const [disbursementTransaction] = await tx.insert(schemas.transactions).values({
                userId: borrowerUserId,
                accountId: loanTrackingAccount.id,
                amount: approvedAmountNum.toFixed(2),
                type: 'deposit', // It's a deposit into the user's account
                status: 'completed',
                description: `Loan disbursement for ${loanRequest.purpose}`,
                transactionRef: `LOANDISB-${Date.now()}-${borrowerUserId.substring(0, 4)}`,
            }).returning();

            const defaultBank = await tx.query.bankAccounts.findFirst({
                where: eq(schemas.bankAccounts.id, upreferences!.defaultAccountId!)
            })

            const bal = Number(defaultBank!.balance) + approvedAmountNum
            console.log("APPROVED_BAL:: ", bal)

            // 6. Update the user's disbursement bank account balance
            await tx.update(schemas.bankAccounts)
                .set({
                    balance: bal.toPrecision(2)
                })
                .where(eq(schemas.bankAccounts.id, defaultBank!.id));
            console.log("Disbursement active", disbursementTransaction)

            const now = new Date()

            console.dir(approvalData)


            // 7. Create the loan approval record
            const [loanApproval] = await tx.insert(schemas.loanApprovals)
                .values({
                    approvedAmount: approvalData.approvedAmount,
                    interestRate: approvalData.interestRate,
                    repaymentStartDate: now,
                    loanRequestId: loanRequestId,
                    approvedByUserId: approvedByUserId,
                    disbursementAccountId: disbursementAccountId,
                    disbursementTransactionId: disbursementTransaction.id,
                    loanAccountId: loanTrackingAccount.id,
                    outstandingPrincipal: approvedAmountNum.toFixed(2), // Initially outstanding principal is the approved amount
                    totalRepayableAmount: totalRepayableAmountNum.toFixed(2),
                    createdAt: now,
                    updatedAt: now,
                })
                .returning();

            if (!loanApproval) {
                throw new Error("Failed to create loan approval record.");
            }

            // 8. Update the loan request status to 'approved' and then 'disbursed'
            await tx.update(schemas.loanRequests)
                .set({ status: 'disbursed' }) // Set to disbursed after all steps
                .where(eq(schemas.loanRequests.id, loanRequestId));

            return loanApproval;
        });

        revalidatePath('/dashboard/loans');
        revalidatePath(`/dashboard/loans/${loanRequestId}`);
        revalidatePath(`/dashboard/accounts/${result?.disbursementAccountId}`); // Revalidate user's account
        revalidatePath(`/dashboard/accounts/${result?.loanAccountId}`); // Revalidate loan tracking account
        return createActionResult(true, result, undefined, "Loan approved and disbursed successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || 'Failed to approve loan');
    }
}

/**
 * Retrieves a specific loan approval by ID, including its request and repayments.
 *
 * @param {string} approvalId - The ID of the loan approval.
 * @param {string} userId - The ID of the user (borrower) for authorization.
 * @returns {Promise<ActionResult<LoanApproval & { loanRequest: LoanRequest; repayments: LoanRepayment[]; } | undefined>>} An action result containing the loan approval details.
 */
export async function getLoanApprovalByIdAction(
    approvalId: string,
    userId: string
): Promise<ActionResult<(LoanApproval & { loanRequest: LoanRequest; repayments: LoanRepayment[]; }) | undefined>> {
    try {
        const loanApproval = await DB.query.loanApprovals.findFirst({
            where: eq(schemas.loanApprovals.id, approvalId),
            with: {
                loanRequest: true,
                repayments: true,
                disbursementAccount: true,
                loanAccount: true,
            }
        });

        // Double check ownership via loanRequest's userId
        if (!loanApproval || loanApproval.loanRequest?.userId !== userId) {
            return createActionResult<undefined>(false, undefined, "NotFound", "Loan approval not found or not associated with your user ID.");
        }

        return createActionResult(true, loanApproval as any, undefined, "Loan approval retrieved successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || 'Failed to fetch loan approval');
    }
}

// --- Loan Repayment Actions ---

/**
 * Records a loan repayment, updates the loan tracking account, and updates outstanding principal.
 * This is a complex transactional operation.
 *
 * @param {string} loanApprovalId - The ID of the loan approval this repayment is for.
 * @param {string} userId - The ID of the user making the repayment.
 * @param {string} repaymentSourceAccountId - The ID of the bank account from which the repayment is made.
 * @param {Omit<NewLoanRepayment, 'userId' | 'loanApprovalId' | 'repaymentSourceAccountId' | 'repaymentTransactionId'>} repaymentData - Data for the repayment.
 * @returns {Promise<ActionResult<LoanRepayment | undefined>>} An action result containing the created repayment, or an error.
 */
export async function recordLoanRepaymentAction(
    loanApprovalId: string,
    userId: string,
    repaymentSourceAccountId: string,
    repaymentData: Omit<NewLoanRepayment, 'userId' | 'loanApprovalId' | 'repaymentSourceAccountId' | 'repaymentTransactionId'>
): Promise<ActionResult<LoanRepayment | undefined>> {
    try {
        const numAmount = parseFloat(repaymentData.amount);
        const numPrincipalPaid = parseFloat(repaymentData.principalPaid);
        const numInterestPaid = parseFloat(repaymentData.interestPaid);

        if (isNaN(numAmount) || isNaN(numPrincipalPaid) || isNaN(numInterestPaid) || numAmount <= 0) {
            throw new Error("Invalid numeric values for repayment.");
        }

        const result = await DB.transaction(async (tx) => {
            // 1. Fetch loan approval and associated loan account
            const loanApproval = await tx.query.loanApprovals.findFirst({
                where: eq(schemas.loanApprovals.id, loanApprovalId),
                with: {
                    loanRequest: {
                        with: {
                            user: true
                        }
                    },
                    loanAccount: true, // The dedicated loan tracking account
                    disbursementAccount: true, // To verify repaymentSourceAccountId
                }
            });

            if (!loanApproval || loanApproval.loanRequest.userId !== userId) {
                throw new Error("Loan approval not found or not associated with your user ID.");
            }

            const loanTrackingAccountId = loanApproval.loanAccountId;
            const loanTrackingAccount = loanApproval.loanAccount;
            if (!loanTrackingAccount || !loanTrackingAccountId) {
                throw new Error("Loan tracking account not found for this loan approval.");
            }

            // 2. Verify repayment source account exists and belongs to the user
            const sourceAccount = await tx.query.bankAccounts.findFirst({
                where: and(
                    eq(schemas.bankAccounts.id, repaymentSourceAccountId),
                    eq(schemas.bankAccounts.userId, userId)
                )
            });

            if (!sourceAccount) {
                throw new Error("Repayment source account not found or does not belong to the user.");
            }

            // Check for sufficient funds in source account (simplified)
            const sourceBalance = parseFloat(sourceAccount.balance);
            if (sourceBalance < numAmount) {
                throw new Error("Insufficient funds in source account for repayment.");
            }

            // 3. Record the repayment transaction
            const repaymentTransaction = await recordTransaction({
                userId,
                accountId: repaymentSourceAccountId,
                amount: numAmount.toFixed(2),
                type: 'withdrawal', // It's a withdrawal from the user's account
                status: 'completed',
                description: `Loan repayment for ${loanApproval.loanRequest?.purpose || 'loan'} (Approval ID: ${loanApprovalId})`,
                transactionRef: `LOANREP-${Date.now()}-${userId.substring(0, 4)}`,
            });

            // 4. Deduct from the user's repayment source bank account balance
            await tx.update(schemas.bankAccounts)
                .set({
                    balance: sql`${schemas.bankAccounts.balance}::numeric - ${numAmount}::numeric`
                })
                .where(eq(schemas.bankAccounts.id, repaymentSourceAccountId));


            // 5. Update the loan tracking account balance (reducing the negative balance towards zero)
            // The loan account balance is negative (debt). Adding repayment amount reduces the debt.
            await tx.update(schemas.bankAccounts)
                .set({
                    balance: sql`${schemas.bankAccounts.balance}::numeric + ${numAmount}::numeric`
                })
                .where(eq(schemas.bankAccounts.id, loanTrackingAccountId));

            // 6. Update the loan approval's outstanding principal
            await tx.update(schemas.loanApprovals)
                .set({
                    outstandingPrincipal: sql`${schemas.loanApprovals.outstandingPrincipal}::numeric - ${numPrincipalPaid}::numeric`
                })
                .where(eq(schemas.loanApprovals.id, loanApprovalId));

            // 7. Create the loan repayment record
            const [newRepayment] = await tx.insert(schemas.loanRepayments)
                .values({
                    ...repaymentData,
                    userId,
                    loanApprovalId,
                    repaymentSourceAccountId,
                    repaymentTransactionId: repaymentTransaction.id,
                })
                .returning();

            if (!newRepayment) {
                throw new Error("Failed to create loan repayment record.");
            }

            // 8. Check if loan is completed and update status
            const updatedLoanApproval = await tx.query.loanApprovals.findFirst({
                where: eq(schemas.loanApprovals.id, loanApprovalId),
                columns: { outstandingPrincipal: true }
            });

            if (updatedLoanApproval && parseFloat(updatedLoanApproval.outstandingPrincipal || "0.00") <= 0) {
                await tx.update(schemas.loanRequests)
                    .set({ status: 'completed' })
                    .where(eq(schemas.loanRequests.id, loanApproval.loanRequest.id));
            }

            return newRepayment;
        });

        revalidatePath('/dashboard/loans');
        revalidatePath(`/dashboard/loans/${loanApprovalId}`);
        revalidatePath(`/dashboard/accounts/${repaymentSourceAccountId}`);
        revalidatePath(`/dashboard/accounts/${result?.loanApprovalId}`); // Revalidate loan tracking account
        return createActionResult(true, result, undefined, "Loan repayment recorded successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || 'Failed to record loan repayment');
    }
}

/**
 * Retrieves a paginated list of all repayments for a specific loan approval.
 *
 * @param {string} loanApprovalId - The ID of the loan approval.
 * @param {string} userId - The ID of the user (borrower) for authorization.
 * @param {number} [limit=10] - The number of repayments per page.
 * @param {string} [cursor] - The cursor for pagination.
 * @returns {Promise<ActionResult<PaginatedResult<LoanRepayment> | undefined>>} A paginated list of loan repayments.
 */
export async function getLoanRepaymentsForApprovalAction(
    loanApprovalId: string,
    userId: string, // For authorization
    limit: number = 10,
    cursor?: string
): Promise<ActionResult<PaginatedResult<LoanRepayment> | undefined>> {
    try {
        // Verify user owns the loan approval
        const loanApproval = await DB.query.loanApprovals.findFirst({
            where: eq(schemas.loanApprovals.id, loanApprovalId),
            with: { loanRequest: { columns: { userId: true } } }
        });

        if (!loanApproval || loanApproval.loanRequest?.userId !== userId) {
            return createActionResult<undefined>(false, undefined, "Unauthorized", "Loan approval not found or not associated with your user ID.");
        }

        const conditions = [eq(schemas.loanRepayments.loanApprovalId, loanApprovalId)];
        if (cursor) {
            conditions.push(lt(schemas.loanRepayments.createdAt, new Date(cursor)));
        }

        const rawRepayments = await DB.query.loanRepayments.findMany({
            where: and(...conditions),
            orderBy: [desc(schemas.loanRepayments.createdAt)],
            limit: limit + 1,
            with: {
                sourceAccount: {
                    columns: { accountName: true, accountNumber: true, currency: true }
                },
                repaymentTransaction: {
                    columns: { id: true, amount: true, description: true }
                }
            }
        });

        const paginatedResult = await withPagination<LoanRepayment>(
            rawRepayments,
            limit,
            'createdAt'
        );

        return createActionResult(true, paginatedResult, undefined, "Loan repayments fetched successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || 'Failed to fetch loan repayments');
    }
}

// Define the structure for loan metrics summary, including trend percentages
export type LoanMetricsSummary = {
    totalOutstandingLoans: string;
    totalLoanPaidBackThisMonth: string;
    upcomingPaymentsThisMonth: string;
    overdueLoansCount: number;
    activeLoansCount: number;
    outstandingLoansTrendPercentage: number;
    paidBackThisMonthTrendPercentage: number;
    upcomingPaymentsTrendPercentage: number;
    overdueLoansCountTrendPercentage: number;
    activeLoansCountTrendPercentage: number;
};

/**
 * Calculates percentage change between current and previous values.
 *
 * @param {number} current - The current value.
 * @param {number} previous - The previous value.
 * @returns {number} The percentage change.
 */
export const calculateTrendPercentage = async (current: number, previous: number): Promise<number> => {
    if (previous === 0) {
        return current > 0 ? 100 : 0; // If previous was 0, and current is positive, it's a 100% increase
    }
    return ((current - previous) / previous) * 100;
};

/**
 * Interface for the data collected for a specific period.
 */
interface PeriodData {
    totalOutstandingLoans: number;
    totalPaidBack: number;
    upcomingPayments: number;
    overdueLoansCount: number;
    activeLoansCount: number;
}

/**
 * Retrieves comprehensive loan metrics for a user, including trends.
 *
 * @param {string} userId - The ID of the user.
 * @param {Date} [currentPeriodEndDate = new Date()] - The end date for the current period (defaults to now).
 * @param {number} [monthsBack = 1] - How many months back to go for previous period comparison.
 * @returns {Promise<ActionResult<LoanMetricsSummary | undefined>>} Aggregated loan data with trends.
 */
export async function getLoanMetricsAction(
    userId: string,
    currentPeriodEndDate: Date = new Date(),
    monthsBack: number = 1
): Promise<ActionResult<LoanMetricsSummary | undefined>> {
    try {
        const currentPeriodStartDate = startOfMonth(currentPeriodEndDate);
        const previousPeriodEndDate = subMonths(currentPeriodEndDate, monthsBack);
        const previousPeriodStartDate = startOfMonth(previousPeriodEndDate);

        /**
         * Helper function to fetch aggregated data for a given period.
         */
        const fetchPeriodData = async (startDate: Date, endDate: Date): Promise<PeriodData> => {
            // Total Outstanding Loans (across all active loans)
            // This metric should reflect the outstanding balance as of the `endDate` of the period.
            // For simplicity here, we're summing current outstanding principals for 'disbursed' loans
            // which might not strictly represent "as of endDate" if principals change daily.
            // A more robust solution might involve historical snapshots or complex queries.
            const outstandingLoansResult = await DB.select({
                total: sum(schemas.loanApprovals.outstandingPrincipal),
            })
                .from(schemas.loanApprovals)
                .innerJoin(schemas.loanRequests, eq(schemas.loanApprovals.loanRequestId, schemas.loanRequests.id))
                .where(
                    and(
                        eq(schemas.loanRequests.userId, userId),
                        eq(schemas.loanRequests.status, 'disbursed') // Only consider active, disbursed loans
                    )
                );
            const totalOutstandingLoans = parseFloat(outstandingLoansResult[0]?.total || "0.00");

            // Total Loan Paid Back for this period (repayments within startDate and endDate)
            const paidBackResult = await DB.select({
                total: sum(schemas.loanRepayments.amount),
            })
                .from(schemas.loanRepayments)
                .where(
                    and(
                        eq(schemas.loanRepayments.userId, userId),
                        gte(schemas.loanRepayments.repaymentDate, startDate),
                        lt(schemas.loanRepayments.repaymentDate, endOfDay(endDate))
                    )
                );
            const totalPaidBack = parseFloat(paidBackResult[0]?.total || "0.00");

            let upcomingPayments = 0;
            let overdueLoansCount = 0;
            let activeLoansCount = 0;

            const userLoanRequests = await DB.query.loanRequests.findMany({
                where: and(
                    eq(schemas.loanRequests.userId, userId),
                    eq(schemas.loanRequests.status, 'disbursed')
                ),
                with: {
                    approval: {
                        with: {
                            repayments: true
                        }
                    }
                }
            });

            const periodStart = startOfDay(startDate);
            const periodEnd = endOfDay(endDate);

            for (const request of userLoanRequests) {
                if (!request.approval || parseFloat(request.approval.outstandingPrincipal) <= 0) {
                    continue; // Skip if no approval or fully repaid
                }

                activeLoansCount++; // Count active loans

                // const approvedAmount = parseFloat(request.approval.approvedAmount);
                const totalRepayableAmount = parseFloat(request.approval.totalRepayableAmount);
                const tenureMonths = parseFloat(request.tenureMonths);

                if (tenureMonths <= 0) continue;

                const estimatedMonthlyPayment = totalRepayableAmount / tenureMonths;
                const loanRepaymentStartDate = request.approval.repaymentStartDate;

                // --- Calculate Overdue Loans for the period ---
                let totalExpectedPaymentsUpToPeriodEnd = 0;
                let totalRepaidActualUpToPeriodEnd = 0;

                const tempExpectedDate = new Date(loanRepaymentStartDate);
                // Calculate expected payments up to the end of the current period
                while (tempExpectedDate <= periodEnd) {
                    totalExpectedPaymentsUpToPeriodEnd += estimatedMonthlyPayment;
                    tempExpectedDate.setMonth(tempExpectedDate.getMonth() + 1);
                }

                // Sum actual repayments up to the end of the current period
                if (request.approval.repayments) {
                    totalRepaidActualUpToPeriodEnd = request.approval.repayments
                        .filter(rep => rep.repaymentDate <= periodEnd)
                        .reduce((sum, rep) => sum + parseFloat(rep.amount), 0);
                }

                if (totalRepaidActualUpToPeriodEnd < totalExpectedPaymentsUpToPeriodEnd && parseFloat(request.approval.outstandingPrincipal) > 0) {
                    overdueLoansCount++;
                }

                // --- Calculate Upcoming Payments for the period ---
                // Find the next expected payment date *within* the current period
                const nextPaymentDueInPeriod = new Date(loanRepaymentStartDate);

                // Advance the date to find the first expected payment within or after the periodStart
                while (nextPaymentDueInPeriod < periodStart) {
                    nextPaymentDueInPeriod.setMonth(nextPaymentDueInPeriod.getMonth() + 1);
                }

                // If this expected payment falls within the period
                if (nextPaymentDueInPeriod >= periodStart && nextPaymentDueInPeriod <= periodEnd) {
                    // Check if this specific payment has been covered by repayments within the period
                    const paymentsInThisSpecificMonth = request.approval.repayments
                        .filter(rep => rep.repaymentDate >= startOfMonth(nextPaymentDueInPeriod) && rep.repaymentDate <= endOfMonth(nextPaymentDueInPeriod))
                        .reduce((sum, rep) => sum + parseFloat(rep.amount), 0);

                    if (paymentsInThisSpecificMonth < estimatedMonthlyPayment) {
                        upcomingPayments += (estimatedMonthlyPayment - paymentsInThisSpecificMonth);
                    }
                }
            }

            return {
                totalOutstandingLoans,
                totalPaidBack,
                upcomingPayments,
                overdueLoansCount,
                activeLoansCount
            };
        };

        const currentData = await fetchPeriodData(currentPeriodStartDate, currentPeriodEndDate);
        const previousData = await fetchPeriodData(previousPeriodStartDate, previousPeriodEndDate);

        // Calculate trends
        const outstandingLoansTrendPercentage = await calculateTrendPercentage(
            currentData.totalOutstandingLoans,
            previousData.totalOutstandingLoans
        );

        const paidBackThisMonthTrendPercentage = await calculateTrendPercentage(
            currentData.totalPaidBack,
            previousData.totalPaidBack
        );

        const upcomingPaymentsTrendPercentage = await calculateTrendPercentage(
            currentData.upcomingPayments,
            previousData.upcomingPayments
        );

        const overdueLoansCountTrendPercentage = await calculateTrendPercentage(
            currentData.overdueLoansCount,
            previousData.overdueLoansCount
        );

        const activeLoansCountTrendPercentage = await calculateTrendPercentage(
            currentData.activeLoansCount,
            previousData.activeLoansCount
        );

        return createActionResult(true, {
            totalOutstandingLoans: currentData.totalOutstandingLoans.toFixed(2),
            totalLoanPaidBackThisMonth: currentData.totalPaidBack.toFixed(2),
            upcomingPaymentsThisMonth: currentData.upcomingPayments.toFixed(2),
            overdueLoansCount: currentData.overdueLoansCount,
            activeLoansCount: currentData.activeLoansCount,
            outstandingLoansTrendPercentage,
            paidBackThisMonthTrendPercentage,
            upcomingPaymentsTrendPercentage,
            overdueLoansCountTrendPercentage,
            activeLoansCountTrendPercentage
        }, undefined, "Loan metrics retrieved successfully.");

    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || 'Failed to retrieve loan metrics');
    }
}

