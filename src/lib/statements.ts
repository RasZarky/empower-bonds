import type { BankAccount, Transaction } from "@/types/db"
import { transactionAmount, transactionDirection } from "./finance"

export interface StatementPeriod {
	key: string
	label: string
	periodStart: string
	periodEnd: string
	opening: number
	inflow: number
	outflow: number
	closing: number
	count: number
	status: "ready" | "current"
}

/**
 * Builds monthly statements for one currency by walking backwards from today's
 * balance, so every statement's closing balance becomes the next one's opening
 * balance and the series reconciles with the account totals.
 */
export function buildStatements(
	transactions: Transaction[],
	accounts: BankAccount[],
	currency: string,
	months: number = 6
): StatementPeriod[] {
	const scopedAccounts = accounts.filter((account) => account.currency === currency)
	const accountIds = new Set(scopedAccounts.map((account) => account.id))
	const scoped = transactions.filter((transaction) => accountIds.has(transaction.accountId))

	let closing = scopedAccounts.reduce((total, account) => {
		const balance = Number.parseFloat(account.balance)
		return total + (Number.isFinite(balance) ? balance : 0)
	}, 0)

	const now = new Date()
	const statements: StatementPeriod[] = []

	for (let offset = 0; offset < months; offset++) {
		const start = new Date(now.getFullYear(), now.getMonth() - offset, 1)
		const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1)
		const rows = scoped.filter((transaction) => {
			const date = new Date(transaction.createdAt)
			return date >= start && date < end
		})

		let inflow = 0
		let outflow = 0

		for (const transaction of rows) {
			const amount = transactionAmount(transaction)
			if (transactionDirection(transaction) === "in") inflow += amount
			else outflow += amount
		}

		const net = inflow - outflow
		const opening = closing - net

		statements.push({
			key: `${start.getFullYear()}-${start.getMonth()}`,
			label: start.toLocaleString("en-US", { month: "long", year: "numeric" }),
			periodStart: start.toISOString(),
			periodEnd: (offset === 0 ? now : new Date(end.getTime() - 1)).toISOString(),
			opening,
			inflow,
			outflow,
			closing,
			count: rows.length,
			status: offset === 0 ? "current" : "ready",
		})

		closing = opening
	}

	return statements
}
