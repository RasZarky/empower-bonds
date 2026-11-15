"use server"

/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcrypt"
import { eq } from "drizzle-orm"
import { DB } from "@/db"
import schemas from "@/db/schemas"
import { createActionResult } from "@/db/helpers/withPagination"
import type { ActionResult } from "@/types/db"

/**
 * Checks the 4-digit transaction PIN a user chose at sign-up against the bcrypt
 * hash stored on their user row.
 *
 * @returns success: true when the PIN matches; otherwise an error whose message
 * is safe to show in the UI.
 */
export async function verifyTransactionPinAction(
	userId: string,
	pin: string
): Promise<ActionResult<boolean>> {
	try {
		const user = await DB.query.user.findFirst({
			where: eq(schemas.user.id, userId),
		})

		if (!user?.hashedTransactionPin) {
			return createActionResult<boolean>(
				false,
				undefined,
				"WrongPin",
				"Wrong password"
			)
		}

		// A malformed/legacy value should read as a failed attempt, not a crash.
		let matches = false
		try {
			matches = await bcrypt.compare(pin, user.hashedTransactionPin)
		} catch {
			matches = false
		}

		if (!matches) {
			return createActionResult<boolean>(
				false,
				undefined,
				"WrongPin",
				"Wrong password"
			)
		}

		return createActionResult<boolean>(true, true, undefined, "PIN verified.")
	} catch (error: any) {
		const err = new Error(error.message || "Failed to verify transaction PIN")
		return createActionResult<boolean>(false, undefined, err.name || "ServerError", err.message)
	}
}

export interface ExternalTransferInput {
	userId: string
	fromAccountId: string
	amount: number
	recipientName: string
	bankName: string
	accountNumber: string
	description?: string
}

/**
 * Sends money to an account held at another bank, recording a single debit on
 * the source account.
 */
export async function externalTransferAction(
	input: ExternalTransferInput
): Promise<ActionResult<{ transactionRef: string } | undefined>> {
	const { userId, fromAccountId, recipientName, bankName, accountNumber } = input
	const amount = Number(input.amount)

	if (!Number.isFinite(amount) || amount <= 0) {
		return createActionResult<undefined>(false, undefined, "ClientError", "Enter an amount greater than zero.")
	}

	if (!recipientName.trim() || !bankName.trim() || !accountNumber.trim()) {
		return createActionResult<undefined>(
			false,
			undefined,
			"ClientError",
			"Enter the recipient name, bank and account number."
		)
	}

	try {
		return await DB.transaction(async (tx) => {
			const account = await tx.query.bankAccounts.findFirst({
				where: eq(schemas.bankAccounts.id, fromAccountId),
			})

			if (!account) {
				return createActionResult<undefined>(false, undefined, "NotFound", "Account not found.")
			}

			if (account.userId !== userId) {
				return createActionResult<undefined>(false, undefined, "Unauthorized", "You do not own this account.")
			}

			const balance = Number.parseFloat(account.balance)

			if (balance < amount) {
				return createActionResult<undefined>(false, undefined, "ClientError", "Insufficient funds.")
			}

			const transactionRef = `EXT-${Date.now().toString(36).toUpperCase()}-${Math.random()
				.toString(36)
				.slice(2, 6)
				.toUpperCase()}`

			await tx
				.update(schemas.bankAccounts)
				.set({ balance: (balance - amount).toFixed(2) })
				.where(eq(schemas.bankAccounts.id, account.id))

			await tx.insert(schemas.transactions).values({
				userId,
				accountId: account.id,
				amount: amount.toFixed(2),
				type: "withdrawal",
				status: "completed",
				description:
					input.description?.trim() ||
					`Transfer to ${recipientName.trim()} · ${bankName.trim()} •••• ${accountNumber.slice(-4)}`,
				transactionRef,
				createdAt: new Date(),
			})

			return createActionResult(
				true,
				{ transactionRef },
				undefined,
				"Transfer sent to the recipient bank."
			)
		})
	} catch (error: any) {
		const err = new Error(error.message || "Failed to send the transfer")
		return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message)
	}
}

export interface TransferInput {
	userId: string
	fromAccountId: string
	toAccountId: string
	amount: number
	description?: string
}

/**
 * Moves money between two of the user's own accounts, writing both legs of the
 * transfer (one per account) in a single database transaction.
 */
export async function transferBetweenAccountsAction(
	input: TransferInput
): Promise<ActionResult<{ transactionRef: string } | undefined>> {
	const { userId, fromAccountId, toAccountId, description } = input
	const amount = Number(input.amount)

	if (!Number.isFinite(amount) || amount <= 0) {
		return createActionResult<undefined>(false, undefined, "ClientError", "Enter an amount greater than zero.")
	}

	if (fromAccountId === toAccountId) {
		return createActionResult<undefined>(false, undefined, "ClientError", "Choose two different accounts.")
	}

	try {
		return await DB.transaction(async (tx) => {
			const fromAccount = await tx.query.bankAccounts.findFirst({
				where: eq(schemas.bankAccounts.id, fromAccountId),
			})
			const toAccount = await tx.query.bankAccounts.findFirst({
				where: eq(schemas.bankAccounts.id, toAccountId),
			})

			if (!fromAccount || !toAccount) {
				return createActionResult<undefined>(false, undefined, "NotFound", "Account not found.")
			}

			if (fromAccount.userId !== userId || toAccount.userId !== userId) {
				return createActionResult<undefined>(false, undefined, "Unauthorized", "You do not own these accounts.")
			}

			if (fromAccount.currency !== toAccount.currency) {
				return createActionResult<undefined>(
					false,
					undefined,
					"ClientError",
					"Transfers must be between accounts in the same currency."
				)
			}

			const balance = Number.parseFloat(fromAccount.balance)

			if (balance < amount) {
				return createActionResult<undefined>(false, undefined, "ClientError", "Insufficient funds.")
			}

			const transactionRef = `TRF-${Date.now().toString(36).toUpperCase()}-${Math.random()
				.toString(36)
				.slice(2, 6)
				.toUpperCase()}`

			await tx.update(schemas.bankAccounts)
				.set({ balance: (balance - amount).toFixed(2) })
				.where(eq(schemas.bankAccounts.id, fromAccount.id))

			await tx.update(schemas.bankAccounts)
				.set({ balance: (Number.parseFloat(toAccount.balance) + amount).toFixed(2) })
				.where(eq(schemas.bankAccounts.id, toAccount.id))

			await tx.insert(schemas.transactions).values([
				{
					userId,
					accountId: fromAccount.id,
					amount: amount.toFixed(2),
					type: "transfer",
					status: "completed",
					description: description || `Transfer to ${toAccount.accountName ?? "account"}`,
					transactionRef,
					createdAt: new Date(),
				},
				{
					userId,
					accountId: toAccount.id,
					amount: amount.toFixed(2),
					type: "transfer",
					status: "completed",
					description: description || `Transfer from ${fromAccount.accountName ?? "account"}`,
					transactionRef: `${transactionRef}-IN`,
					createdAt: new Date(),
				},
			])

			return createActionResult(true, { transactionRef }, undefined, "Transfer completed successfully.")
		})
	} catch (error: any) {
		const err = new Error(error.message || "Failed to transfer funds")
		return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message)
	}
}
