// src/app/api/actions/card.ts
'use server';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { DB } from "@/db";
import { createActionResult, withPagination } from "@/db/helpers/withPagination";
import schemas from "@/db/schemas"; // Import your main schemas object
import { and, eq, lt, not, sql } from "drizzle-orm"; // Import sql for numeric operations
import { revalidatePath } from "next/cache";

import type {
    ActionResult,
    Card,
    NewCard,
    UpdateCard,
    Transaction,
    PaginatedResult,
    NewTransaction, // Import NewTransaction type
    TransactionTypeEnum, // Import transactionTypeEnum values if needed
} from "@/types/db"; // Ensure your types/db is updated with all necessary types

// --- Helper Functions ---

/**
 * Records a transaction linked to a card, but primarily affecting its associated bank account.
 * This helper is used internally by card-related financial actions.
 *
 * @param {string} userId - The ID of the user.
 * @param {string} cardId - The ID of the card involved in the transaction.
 * @param {string} accountId - The ID of the bank account linked to the card.
 * @param {string} amount - The transaction amount.
 * @param {TransactionTypeEnum} type - The type of transaction (e.g., 'deposit', 'withdrawal', 'purchase').
 * @param {string} [description] - Optional description for the transaction.
 * @returns {Promise<Transaction>} The created transaction record.
 */
async function recordCardTransaction(
    userId: string,
    cardId: string,
    accountId: string, // Crucial: Now explicitly requires accountId
    amount: string,
    type: TransactionTypeEnum, // Use the correct enum type
    description?: string
): Promise<Transaction> {
    const transactionRef = `${type.toUpperCase().substring(0, 3)}-${Date.now()}-${userId.substring(0, 4)}-${cardId.substring(0, 4)}`;

    const transactionData: Omit<NewTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        accountId, // Link to the bank account
        amount,
        type,
        status: 'completed', // Assuming immediate completion for these actions
        description: description || `${type} via card **** ${cardId.slice(-4)}`,
        transactionRef,
    };

    const [transaction] = await DB
        .insert(schemas.transactions) // Use schemas.transactions
        .values(transactionData)
        .returning();

    if (!transaction) {
        throw new Error(`Failed to record ${type} transaction.`);
    }
    return transaction;
}

// --- Card Management Actions ---

/**
 * Adds a new card for a user.
 * If the card is set as default, it ensures no other cards for the user are default.
 *
 * @param {string} userId - The ID of the user adding the card.
 * @param {Omit<NewCard, 'userId'>} cardData - The data for the new card (excluding userId).
 * @returns {Promise<ActionResult<Card | undefined>>} Action result with the new card or an error.
 */
export async function addCardAction(
    userId: string,
    cardData: Omit<NewCard, 'userId'>
): Promise<ActionResult<Card | undefined>> {
    try {
        // Input validation for important fields
        if (!cardData.accountId) {
            throw new Error("Associated bank account is required for the card.");
        }
        if (!cardData.cardNumber) {
            throw new Error("Card number is required.");
        }
        // Add more validation as needed (e.g., expirationDate, cvv format)

        const result = await DB.transaction(async (tx) => {
            // Validate that the linked account exists and belongs to the user
            const account = await tx.query.bankAccounts.findFirst({
                where: and(
                    eq(schemas.bankAccounts.id, cardData.accountId),
                    eq(schemas.bankAccounts.userId, userId)
                )
            });
            if (!account) {
                throw new Error("Associated bank account not found or does not belong to the user.");
            }

            // If setting as default, first unset any existing default card
            if (cardData.isDefault) {
                await tx
                    .update(schemas.cards) // Use schemas.cards
                    .set({ isDefault: false })
                    .where(and(
                        eq(schemas.cards.userId, userId),
                        eq(schemas.cards.isDefault, true)
                    ));
            }

            const [newCard] = await tx
                .insert(schemas.cards) // Use schemas.cards
                .values({
                    ...cardData,
                    userId
                })
                .returning();

            if (!newCard) {
                throw new Error("Failed to add new card.");
            }
            return newCard;
        });


        revalidatePath('/dashboard/cards');
        revalidatePath(`/dashboard/accounts/${cardData.accountId}`); // Revalidate account page as well
        return createActionResult<Card>(true, result, undefined, "Card added successfully.");
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to add card');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Updates an existing card for a user.
 * Handles setting/unsetting default status.
 *
 * @param {string} cardId - The ID of the card to update.
 * @param {string} userId - The ID of the user who owns the card.
 * @param {UpdateCard} cardData - Partial data to update the card.
 * @returns {Promise<ActionResult<Card | undefined>>} Action result with the updated card or an error.
 */
export async function updateCardAction(
    cardId: string,
    userId: string,
    cardData: UpdateCard
): Promise<ActionResult<Card | undefined>> {
    try {
        const result = await DB.transaction(async (tx) => {
            // Verify card ownership first
            const existingCard = await tx.query.cards.findFirst({
                where: and(eq(schemas.cards.id, cardId), eq(schemas.cards.userId, userId))
            });

            if (!existingCard) {
                throw new Error("Card not found or not owned by user.");
            }

            // If cardData includes accountId, validate it
            if (cardData.accountId && cardData.accountId !== existingCard.accountId) {
                const account = await tx.query.bankAccounts.findFirst({
                    where: and(
                        eq(schemas.bankAccounts.id, cardData.accountId),
                        eq(schemas.bankAccounts.userId, userId)
                    )
                });
                if (!account) {
                    throw new Error("New associated bank account not found or does not belong to the user.");
                }
            }

            // If setting as default, first unset any existing default card (excluding the current one)
            if (cardData.isDefault) {
                await tx
                    .update(schemas.cards)
                    .set({ isDefault: false })
                    .where(and(
                        eq(schemas.cards.userId, userId),
                        eq(schemas.cards.isDefault, true),
                        not(eq(schemas.cards.id, cardId)) // Don't unset the current card if it's already default
                    ));
            }

            const [updatedCard] = await tx
                .update(schemas.cards)
                .set(cardData)
                .where(and(
                    eq(schemas.cards.id, cardId),
                    eq(schemas.cards.userId, userId)
                ))
                .returning();

            if (!updatedCard) {
                throw new Error('Failed to update card.');
            }
            return updatedCard;
        });

        revalidatePath('/dashboard/cards');
        revalidatePath(`/dashboard/cards/${cardId}`);
        // If accountId might have changed, revalidate old and new account paths
        if (result?.accountId) {
            revalidatePath(`/dashboard/accounts/${result.accountId}`);
        }
        return createActionResult<Card>(true, result, undefined, "Card updated successfully.");
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to update card');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Deletes a specific card for a user.
 *
 * @param {string} cardId - The ID of the card to delete.
 * @param {string} userId - The ID of the user who owns the card.
 * @returns {Promise<ActionResult<{ id: string } | undefined>>} Action result with the ID of the deleted card or an error.
 */
export async function deleteCardAction(
    cardId: string,
    userId: string
): Promise<ActionResult<{ id: string } | undefined>> {
    try {
        // Transaction to ensure associated account path is revalidated correctly
        const result = await DB.transaction(async (tx) => {
            // Fetch card before deleting to get its accountId
            const cardToDelete = await tx.query.cards.findFirst({
                where: and(eq(schemas.cards.id, cardId), eq(schemas.cards.userId, userId)),
                columns: { accountId: true, id: true }
            });

            if (!cardToDelete) {
                throw new Error('Card not found or not owned by user.');
            }

            const [deletedCard] = await tx
                .delete(schemas.cards)
                .where(and(
                    eq(schemas.cards.id, cardId),
                    eq(schemas.cards.userId, userId)
                ))
                .returning({ id: schemas.cards.id });

            if (!deletedCard) {
                throw new Error('Failed to delete card.'); // Should not happen if cardToDelete was found
            }
            return { deletedCard, accountId: cardToDelete.accountId };
        });

        revalidatePath('/dashboard/cards');
        revalidatePath(`/dashboard/accounts/${result.accountId}`); // Revalidate the associated account page
        return createActionResult<{ id: string }>(true, result.deletedCard, undefined, "Card deleted successfully.");
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to delete card');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Retrieves a specific card by its ID for a user.
 *
 * @param {string} cardId - The ID of the card to retrieve.
 * @param {string} userId - The ID of the user who owns the card.
 * @returns {Promise<ActionResult<Card | undefined>>} Action result with the card or an error.
 */
export async function getCardByIdAction(
    cardId: string,
    userId: string
): Promise<ActionResult<Card | undefined>> {
    try {
        const card = await DB.query.cards.findFirst({
            where: and(
                eq(schemas.cards.id, cardId),
                eq(schemas.cards.userId, userId)
            ),
        });

        if (!card) {
            return createActionResult<undefined>(false, undefined, "NotFound", "Card not found or not owned by user.");
        }

        return createActionResult<Card>(true, card, undefined, "Card fetched successfully.");
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to fetch card');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Retrieves a paginated list of all cards for a specific user.
 *
 * @param {string} userId - The ID of the user.
 * @param {number} [pageSize=10] - The number of cards per page.
 * @param {string} [cursor] - The cursor for pagination (e.g., createdAt timestamp of the last item from the previous page).
 * @returns {Promise<ActionResult<PaginatedResult<Card> | undefined>>} Action result with a paginated list of cards or an error.
 */
export async function getUserCardsAction(
    userId: string,
    pageSize: number = 10,
    cursor?: string
): Promise<ActionResult<PaginatedResult<Card> | undefined>> {
    try {
        const query = DB
            .select()
            .from(schemas.cards)
            .where(and(
                eq(schemas.cards.userId, userId),
                cursor ? lt(schemas.cards.createdAt, new Date(cursor)) : undefined
            ))
            .orderBy(schemas.cards.createdAt); // Order by creation date for consistent pagination

        const cardsList = await query.limit(pageSize + 1);

        const paginatedResult = await withPagination<Card>(
            cardsList,
            pageSize,
            'createdAt'
        );

        return createActionResult<PaginatedResult<Card>>(true, paginatedResult, undefined, "Cards fetched successfully.");
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to fetch cards');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Sets a specific card as the default for a user.
 * Ensures only one card is marked as default at a time.
 *
 * @param {string} cardId - The ID of the card to set as default.
 * @param {string} userId - The ID of the user who owns the card.
 * @returns {Promise<ActionResult<Card | undefined>>} Action result with the newly default card or an error.
 */
export async function setDefaultCardAction(
    cardId: string,
    userId: string
): Promise<ActionResult<Card | undefined>> {
    try {
        const result = await DB.transaction(async (tx) => {
            // First unset any existing default card for this user
            await tx
                .update(schemas.cards)
                .set({ isDefault: false })
                .where(and(
                    eq(schemas.cards.userId, userId),
                    eq(schemas.cards.isDefault, true)
                ));

            // Then set the new default card
            const [defaultCard] = await tx
                .update(schemas.cards)
                .set({ isDefault: true })
                .where(and(
                    eq(schemas.cards.id, cardId),
                    eq(schemas.cards.userId, userId)
                ))
                .returning();

            if (!defaultCard) {
                throw new Error('Card not found or not owned by user.');
            }

            return defaultCard;
        });

        revalidatePath('/dashboard/cards');
        return createActionResult<Card>(true, result, undefined, "Default card set successfully.");
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to set default card');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Handles a deposit to a card, which translates to a deposit to the linked bank account.
 * Updates the bank account balance and records a transaction.
 *
 * @param {string} cardId - The ID of the card receiving the deposit.
 * @param {string} userId - The ID of the user.
 * @param {string} amount - The amount to deposit.
 * @param {string} [description] - Optional description.
 * @returns {Promise<ActionResult<Card | undefined>>} Action result with the updated card or an error.
 */
export async function depositToCardAction(
    cardId: string,
    userId: string,
    amount: string,
    description?: string
): Promise<ActionResult<Card | undefined>> {
    try {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            throw new Error("Invalid deposit amount.");
        }

        const result = await DB.transaction(async (tx) => {
            // 1. Fetch the card to get its linked accountId
            const card = await tx.query.cards.findFirst({
                where: and(
                    eq(schemas.cards.id, cardId),
                    eq(schemas.cards.userId, userId)
                ),
                columns: { accountId: true, id: true } // Select only necessary fields
            });

            if (!card) {
                throw new Error('Card not found or not owned by user.');
            }

            // 2. Update the linked bank account's balance
            const [updatedAccount] = await tx.update(schemas.bankAccounts)
                .set({
                    balance: sql`${schemas.bankAccounts.balance} + ${numAmount}`
                })
                .where(and(
                    eq(schemas.bankAccounts.id, card.accountId),
                    eq(schemas.bankAccounts.userId, userId)
                ))
                .returning();

            if (!updatedAccount) {
                tx.rollback(); // Rollback if account update fails
                throw new Error("Failed to credit amount to linked bank account.");
            }

            // 3. Record the transaction
            const transaction = await recordCardTransaction(
                userId,
                card.id,
                card.accountId, // Pass the accountId
                amount,
                'deposit',
                description
            );

            // Fetch the updated card record to return (optional, but good for UI)
            const [updatedCardData] = await tx.select().from(schemas.cards).where(eq(schemas.cards.id, cardId));
            if (!updatedCardData) {
                throw new Error("Failed to retrieve updated card data after deposit.");
            }

            return { card: updatedCardData, transaction };
        });

        revalidatePath('/dashboard/cards');
        revalidatePath(`/dashboard/cards/${cardId}`);
        revalidatePath(`/dashboard/accounts/${result.card.accountId}`); // Revalidate the associated account page
        return createActionResult<Card>(true, result.card, undefined, "Deposit to card (and linked account) successful.");
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to deposit to card');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Handles a withdrawal from a card, which translates to a withdrawal from the linked bank account.
 * Updates the bank account balance and records a transaction, with a balance check.
 *
 * @param {string} cardId - The ID of the card initiating the withdrawal.
 * @param {string} userId - The ID of the user.
 * @param {string} amount - The amount to withdraw.
 * @param {string} [description] - Optional description.
 * @returns {Promise<ActionResult<Card | undefined>>} Action result with the updated card or an error.
 */
export async function withdrawFromCardAction(
    cardId: string,
    userId: string,
    amount: string,
    description?: string
): Promise<ActionResult<Card | undefined>> {
    try {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            throw new Error("Invalid withdrawal amount.");
        }

        const result = await DB.transaction(async (tx) => {
            // 1. Fetch the card and its linked account to get balance
            const card = await tx.query.cards.findFirst({
                where: and(
                    eq(schemas.cards.id, cardId),
                    eq(schemas.cards.userId, userId)
                ),
                with: {
                    bankAccount: true
                }
            });

            if (!card || !card.bankAccount) {
                throw new Error('Card not found, not owned by user, or linked account not found.');
            }

            // 2. Check for sufficient funds in the linked bank account
            if (Number(card.bankAccount.balance) < numAmount) {
                throw new Error('Insufficient funds in the linked bank account.');
            }

            // 3. Deduct from the linked bank account's balance
            const [updatedAccount] = await tx.update(schemas.bankAccounts)
                .set({
                    balance: sql`${schemas.bankAccounts.balance} - ${numAmount}`
                })
                .where(and(
                    eq(schemas.bankAccounts.id, card.accountId),
                    eq(schemas.bankAccounts.userId, userId)
                ))
                .returning();

            if (!updatedAccount) {
                tx.rollback(); // Rollback if account update fails
                throw new Error("Failed to deduct amount from linked bank account.");
            }

            // 4. Record the transaction
            const transaction = await recordCardTransaction(
                userId,
                card.id,
                card.accountId, // Pass the accountId
                amount,
                'withdrawal',
                description
            );

            // Fetch the updated card record to return (optional, but good for UI)
            const [updatedCardData] = await tx.select().from(schemas.cards).where(eq(schemas.cards.id, cardId));
            if (!updatedCardData) {
                throw new Error("Failed to retrieve updated card data after withdrawal.");
            }

            return { card: updatedCardData, transaction };
        });

        revalidatePath('/dashboard/cards');
        revalidatePath(`/dashboard/cards/${cardId}`);
        revalidatePath(`/dashboard/accounts/${result.card.accountId}`); // Revalidate the associated account page
        return createActionResult<Card>(true, result.card, undefined, "Withdrawal from card (and linked account) successful.");
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to withdraw from card');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}