import type { BankAccount, Preference, Session, Transaction, User } from "@/types/db"

/**
 * Sample data for the demo dashboard. Nothing here touches the database —
 * it exists so the UI can be reviewed without Postgres, Redis or Resend.
 */

const daysAgo = (days: number, hour = 10) => {
	const date = new Date()
	date.setDate(date.getDate() - days)
	date.setHours(hour, 15, 0, 0)
	return date
}

export const DEMO_USER: User = {
	id: "demo-user",
	name: "Ada Okafor",
	email: "ada.demo@empowerbonds.test",
	emailVerified: true,
	image: null,
	blocked: false,
	twoFactorEnabled: false,
	admin: false,
	hashedTransactionPin: null,
	createdAt: new Date("2024-03-12T09:00:00.000Z"),
	updatedAt: new Date("2026-11-01T09:00:00.000Z"),
}

export const DEMO_ACCOUNTS: BankAccount[] = [
	{
		id: "demo-account-checking",
		userId: DEMO_USER.id,
		accountNumber: "0821012345",
		accountType: "checking",
		balance: "12480.55",
		currency: "USD",
		bankName: "Empower Bonds",
		branchName: "Downtown",
		accountName: "Everyday checking",
		status: "active",
		isPrimary: true,
		createdAt: new Date("2024-03-12T09:05:00.000Z"),
		updatedAt: daysAgo(1),
	},
	{
		id: "demo-account-savings",
		userId: DEMO_USER.id,
		accountNumber: "0822045678",
		accountType: "savings",
		balance: "4210.00",
		currency: "USD",
		bankName: "Empower Bonds",
		branchName: "Downtown",
		accountName: "Rainy day savings",
		status: "active",
		isPrimary: false,
		createdAt: new Date("2024-06-02T11:20:00.000Z"),
		updatedAt: daysAgo(4),
	},
	{
		id: "demo-account-euro",
		userId: DEMO_USER.id,
		accountNumber: "0825067890",
		accountType: "fixed_deposit",
		balance: "1800.00",
		currency: "EUR",
		bankName: "Empower Bonds",
		branchName: "Brussels",
		accountName: "Euro fixed deposit",
		status: "active",
		isPrimary: false,
		createdAt: new Date("2025-01-18T08:40:00.000Z"),
		updatedAt: daysAgo(20),
	},
]

export const DEMO_TRANSACTIONS: Transaction[] = [
	{
		id: "demo-tx-1",
		userId: DEMO_USER.id,
		accountId: "demo-account-checking",
		amount: "2400.00",
		type: "deposit",
		status: "completed",
		description: "Salary — November",
		transactionRef: "TRX-9F31A2",
		createdAt: daysAgo(1, 9),
		updatedAt: daysAgo(1, 9),
	},
	{
		id: "demo-tx-2",
		userId: DEMO_USER.id,
		accountId: "demo-account-checking",
		amount: "84.32",
		type: "purchase",
		status: "completed",
		description: "Whole Foods Market",
		transactionRef: "TRX-4C08B7",
		createdAt: daysAgo(2, 18),
		updatedAt: daysAgo(2, 18),
	},
	{
		id: "demo-tx-3",
		userId: DEMO_USER.id,
		accountId: "demo-account-checking",
		amount: "500.00",
		type: "transfer",
		status: "completed",
		description: "Transfer to rainy day savings",
		transactionRef: "TRX-77D1E9",
		createdAt: daysAgo(3, 12),
		updatedAt: daysAgo(3, 12),
	},
	{
		id: "demo-tx-4",
		userId: DEMO_USER.id,
		accountId: "demo-account-savings",
		amount: "500.00",
		type: "deposit",
		status: "completed",
		description: "Transfer from everyday checking",
		transactionRef: "TRX-77D1EA",
		createdAt: daysAgo(3, 12),
		updatedAt: daysAgo(3, 12),
	},
	{
		id: "demo-tx-5",
		userId: DEMO_USER.id,
		accountId: "demo-account-checking",
		amount: "39.99",
		type: "fee",
		status: "completed",
		description: "Monthly account fee",
		transactionRef: "TRX-1A55C0",
		createdAt: daysAgo(5, 8),
		updatedAt: daysAgo(5, 8),
	},
	{
		id: "demo-tx-6",
		userId: DEMO_USER.id,
		accountId: "demo-account-euro",
		amount: "120.00",
		type: "withdrawal",
		status: "pending",
		description: "ATM withdrawal — Brussels",
		transactionRef: "TRX-6B2EF4",
		createdAt: daysAgo(6, 16),
		updatedAt: daysAgo(6, 16),
	},
	{
		id: "demo-tx-7",
		userId: DEMO_USER.id,
		accountId: "demo-account-checking",
		amount: "18.75",
		type: "purchase",
		status: "completed",
		description: "Spotify subscription",
		transactionRef: "TRX-2D90AB",
		createdAt: daysAgo(9, 7),
		updatedAt: daysAgo(9, 7),
	},
]

export const DEMO_PREFERENCE: Preference = {
	id: "demo-preference",
	userId: DEMO_USER.id,
	currency: "USD",
	currencyDisplayFormat: "symbol_before",
	language: "en",
	timezone: "America/New_York",
	theme: "dark",
	defaultAccountId: "demo-account-checking",
	hideBalances: false,
	transactionDisplayPreference: "merchant_name",
	budgetAlertThreshold: "80.00",
	budgetAlertFrequency: "daily",
	requireBiometricForSensitiveActions: false,
	createdAt: new Date("2024-03-12T09:05:00.000Z"),
	updatedAt: daysAgo(10),
}

export const DEMO_SESSIONS: Session[] = [
	{
		id: "demo-session-laptop",
		expiresAt: daysAgo(-6),
		token: "demo-token-laptop",
		createdAt: daysAgo(2, 20),
		updatedAt: daysAgo(1, 20),
		ipAddress: "192.168.0.24",
		userAgent: "Chrome on macOS",
		userId: DEMO_USER.id,
	},
	{
		id: "demo-session-phone",
		expiresAt: daysAgo(-4),
		token: "demo-token-phone",
		createdAt: daysAgo(4, 8),
		updatedAt: daysAgo(1, 8),
		ipAddress: "192.168.0.31",
		userAgent: "Empower Bonds app on Android",
		userId: DEMO_USER.id,
	},
]

/** Mirrors the filters accepted by `getTransactionsAction`, applied in memory. */
export function filterDemoTransactions(filters?: {
	type?: string
	status?: string
	search?: string
}): Transaction[] {
	const search = filters?.search?.toLowerCase()

	return DEMO_TRANSACTIONS.filter((transaction) => {
		if (filters?.type && transaction.type !== filters.type) return false
		if (filters?.status && transaction.status !== filters.status) return false
		if (search && !(transaction.description ?? "").toLowerCase().includes(search)) return false
		return true
	})
}
