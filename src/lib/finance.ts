import type { Transaction } from "@/types/db"

/**
 * Small, dependency-free helpers for the dashboard analytics. They work on any
 * transaction list, so the real and demo dashboards share the same maths.
 *
 * Transfers move money between the user's own accounts, so they are excluded
 * from income/expense totals to avoid double counting.
 */

export function isIncome(transaction: Transaction): boolean {
	return transaction.type === "deposit" || transaction.type === "sale"
}

export function isTransfer(transaction: Transaction): boolean {
	return transaction.type === "transfer"
}

/**
 * Which way money moved. Demo transactions carry an explicit `direction`,
 * which matters for the two legs of an internal transfer; real rows fall back
 * to their type.
 */
export function transactionDirection(transaction: Transaction): "in" | "out" {
	const direction = (transaction as Transaction & { direction?: "in" | "out" }).direction
	if (direction === "in" || direction === "out") return direction
	return isIncome(transaction) ? "in" : "out"
}

export function transactionAmount(transaction: Transaction): number {
	const amount = Number.parseFloat(transaction.amount)
	return Number.isFinite(amount) ? Math.abs(amount) : 0
}

export interface TransactionSummary {
	income: number
	expenses: number
	net: number
	savingsRate: number | null
}

/**
 * `rate` converts a transaction's amount into the currency being displayed, so
 * a mixed-currency ledger still produces one meaningful total.
 */
export function summarizeTransactions(
	transactions: Transaction[],
	rate: (transaction: Transaction) => number = () => 1
): TransactionSummary {
	let income = 0
	let expenses = 0

	for (const transaction of transactions) {
		if (isTransfer(transaction)) continue
		const amount = transactionAmount(transaction) * rate(transaction)

		if (isIncome(transaction)) income += amount
		else expenses += amount
	}

	const net = income - expenses

	return {
		income,
		expenses,
		net,
		savingsRate: income > 0 ? Math.round((net / income) * 100) : null,
	}
}

export function withinDays(transactions: Transaction[], days: number): Transaction[] {
	const cutoff = new Date()
	cutoff.setDate(cutoff.getDate() - days)

	return transactions.filter((transaction) => new Date(transaction.createdAt) >= cutoff)
}

export interface CashFlowBucket {
	key: string
	label: string
	income: number
	expenses: number
}

/** Income and expenses per calendar month, oldest bucket first. */
export function monthlyCashFlow(
	transactions: Transaction[],
	months: number = 6,
	rate: (transaction: Transaction) => number = () => 1
): CashFlowBucket[] {
	const now = new Date()
	const buckets: CashFlowBucket[] = []

	for (let offset = months - 1; offset >= 0; offset--) {
		const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
		buckets.push({
			key: `${date.getFullYear()}-${date.getMonth()}`,
			label: date.toLocaleString("en-US", { month: "short" }),
			income: 0,
			expenses: 0,
		})
	}

	const byMonth = new Map(buckets.map((bucket) => [bucket.key, bucket]))

	for (const transaction of transactions) {
		if (isTransfer(transaction)) continue

		const date = new Date(transaction.createdAt)
		const bucket = byMonth.get(`${date.getFullYear()}-${date.getMonth()}`)
		if (!bucket) continue

		const amount = transactionAmount(transaction) * rate(transaction)
		if (isIncome(transaction)) bucket.income += amount
		else bucket.expenses += amount
	}

	return buckets
}
