/**
 * Formats a monetary amount (the DB stores balances as numeric strings).
 * Falls back to a plain "CODE 0.00" string when the currency is not ISO-4217.
 */
export function formatCurrency(
	value: string | number | null | undefined,
	currency: string = "USD"
): string {
	const parsed = typeof value === "string" ? Number.parseFloat(value) : value
	const amount = typeof parsed === "number" && Number.isFinite(parsed) ? parsed : 0

	try {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency,
			minimumFractionDigits: 2,
		}).format(amount)
	} catch {
		return `${currency} ${amount.toFixed(2)}`
	}
}

export function formatDate(value: Date | string | null | undefined): string {
	if (!value) return "—"
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(new Date(value))
}

export function formatDateTime(value: Date | string | null | undefined): string {
	if (!value) return "—"
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(value))
}

export function maskAccountNumber(accountNumber: string | null | undefined): string {
	if (!accountNumber) return "—"
	return `•••• ${accountNumber.slice(-4)}`
}

/** Groups accounts by currency and sums their balances. */
export function sumBalancesByCurrency(
	accounts: { balance: string; currency: string }[]
): Record<string, number> {
	return accounts.reduce<Record<string, number>>((totals, account) => {
		const amount = Number.parseFloat(account.balance)
		totals[account.currency] = (totals[account.currency] ?? 0) + (Number.isFinite(amount) ? amount : 0)
		return totals
	}, {})
}
