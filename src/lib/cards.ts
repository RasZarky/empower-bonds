import type { BankAccount } from "@/types/db"

export interface DebitCard {
	id: string
	accountId: string
	accountName: string
	accountNumber: string | null
	holder: string
	network: "Visa" | "Mastercard"
	last4: string
	expiry: string
	currency: string
	isPrimary: boolean
}

const CARD_ACCOUNT_TYPES = new Set(["checking", "current", "savings"])

/**
 * Cards are derived from the account they spend from, so the dashboard never
 * shows a card that is not backed by an account.
 */
export function buildCards(accounts: BankAccount[], holder: string): DebitCard[] {
	return accounts
		.filter(
			(account) =>
				CARD_ACCOUNT_TYPES.has(account.accountType) && account.status !== "closed"
		)
		.map((account, index) => {
			const opened = new Date(account.createdAt)
			const month = String(((opened.getMonth() + 3) % 12) + 1).padStart(2, "0")
			const year = String(opened.getFullYear() + 5).slice(-2)

			return {
				id: `card-${account.id}`,
				accountId: account.id,
				accountName: account.accountName ?? "Account",
				accountNumber: account.accountNumber,
				holder: holder || "Card holder",
				network: index % 2 === 0 ? "Visa" : "Mastercard",
				last4: account.accountNumber?.slice(-4) ?? String(4200 + index),
				expiry: `${month}/${year}`,
				currency: account.currency,
				isPrimary: Boolean(account.isPrimary),
			}
		})
}
