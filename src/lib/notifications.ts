import type { Transaction } from "@/types/db"
import { formatCurrency } from "./format"
import { transactionAmount, transactionDirection } from "./finance"

export type NotificationTone = "success" | "info" | "warning"

export interface AppNotification {
	id: string
	title: string
	body: string
	time: Date
	tone: NotificationTone
}

function hoursAgo(hours: number): Date {
	const date = new Date()
	date.setHours(date.getHours() - hours)
	return date
}

/**
 * Activity feed for the header bell. Demo visitors get notifications derived
 * from their sample ledger; signed-in users get account/service notices.
 */
export function buildNotifications(input: {
	name?: string
	transactions?: Transaction[]
}): AppNotification[] {
	const { name, transactions } = input
	const firstName = name?.split(" ")[0] || "there"

	if (transactions && transactions.length > 0) {
		return transactions.slice(0, 4).map((transaction) => {
			const incoming = transactionDirection(transaction) === "in"
			const amount = formatCurrency(transactionAmount(transaction))

			return {
				id: `tx-${transaction.id}`,
				title: incoming ? `You received ${amount}` : `Payment of ${amount}`,
				body: transaction.description || "Account activity",
				time: new Date(transaction.createdAt),
				tone: transaction.status === "pending" ? "warning" : incoming ? "success" : "info",
			}
		})
	}

	return [
		{
			id: "statement-ready",
			title: "Your statement is ready",
			body: "Last month's statement is available to download.",
			time: hoursAgo(3),
			tone: "info",
		},
		{
			id: "welcome",
			title: `Welcome back, ${firstName}`,
			body: "Review your accounts and recent activity.",
			time: hoursAgo(20),
			tone: "success",
		},
		{
			id: "security-tip",
			title: "Keep your account secure",
			body: "Never share your secret code, even with our support team.",
			time: hoursAgo(30),
			tone: "warning",
		},
	]
}
