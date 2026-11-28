import type {
	BankAccount,
	Preference,
	Session,
	Transaction,
	TransactionStatusEnum,
	TransactionTypeEnum,
	User,
} from "@/types/db"

/**
 * Sample data for the demo dashboard.
 *
 * Balances are not hard-coded: every account starts from an opening balance and
 * the closing balance is derived from the ledger below, so the dashboard totals
 * always reconcile with the transaction history.
 */

export type DemoTransaction = Transaction & { direction: "in" | "out" }

const NOW = new Date()

/** Returns a date inside the month `monthsAgo`, or null when it would be in the future. */
function dateInMonth(monthsAgo: number, day: number): Date | null {
	const date = new Date()
	date.setDate(1)
	date.setMonth(date.getMonth() - monthsAgo)
	date.setDate(day)
	date.setHours(10, 15, 0, 0)
	return date > NOW ? null : date
}

function daysAgo(days: number, hour = 10, minute = 15): Date {
	const date = new Date()
	date.setDate(date.getDate() - days)
	date.setHours(hour, minute, 0, 0)
	return date
}

/**
 * The demo account always signed in two days ago. Evaluated on every call so the
 * dashboard date follows the calendar instead of freezing at build/boot time.
 */
export function demoLastSignIn(): Date {
	const date = new Date()
	date.setDate(date.getDate() - 2)
	date.setHours(9, 30, 0, 0)
	return date
}

const accountSeeds = {
	checking: {
		id: "demo-account-checking",
		accountType: "checking" as const,
		accountName: "Everyday checking",
		accountNumber: "0821012345",
		currency: "USD",
		bankName: "Empower Bonds",
		branchName: "Downtown",
		opening: 196_961,
		createdAt: new Date("2023-02-08T09:05:00.000Z"),
		isPrimary: true,
	},
	savings: {
		id: "demo-account-savings",
		accountType: "savings" as const,
		accountName: "High-yield savings",
		accountNumber: "0822045678",
		currency: "USD",
		bankName: "Empower Bonds",
		branchName: "Downtown",
		opening: 1_194_755.67,
		createdAt: new Date("2023-05-19T11:20:00.000Z"),
		isPrimary: false,
	},
	fixed: {
		id: "demo-account-fixed",
		accountType: "fixed_deposit" as const,
		accountName: "Fixed deposit — 12 months",
		accountNumber: "0825081122",
		currency: "USD",
		bankName: "Empower Bonds",
		branchName: "Corporate",
		opening: 990_000,
		createdAt: new Date("2024-01-04T08:40:00.000Z"),
		isPrimary: false,
	},
	euro: {
		id: "demo-account-euro",
		accountType: "current" as const,
		accountName: "Euro account",
		accountNumber: "0825067890",
		currency: "EUR",
		bankName: "Empower Bonds",
		branchName: "Brussels",
		opening: 21_400,
		createdAt: new Date("2024-09-12T08:40:00.000Z"),
		isPrimary: false,
	},
}

type AccountKey = keyof typeof accountSeeds

interface EntrySeed {
	account: AccountKey
	date: Date
	amount: number
	type: TransactionTypeEnum
	direction: "in" | "out"
	description: string
	status?: TransactionStatusEnum
}

type RecurringSeed = Omit<EntrySeed, "date"> & { day: number }
type OneOffSeed = Omit<EntrySeed, "date"> & { monthsAgo: number; day: number }

const RECURRING = [
	{ day: 1, account: "checking", amount: 26_500, type: "deposit", direction: "in", description: "Salary — Northwind Holdings" },
	{ day: 3, account: "checking", amount: 8_420.55, type: "withdrawal", direction: "out", description: "Mortgage payment" },
	{ day: 5, account: "checking", amount: 340.2, type: "withdrawal", direction: "out", description: "Electricity & water" },
	{ day: 7, account: "checking", amount: 1_240.75, type: "purchase", direction: "out", description: "Groceries — Whole Foods" },
	{ day: 12, account: "checking", amount: 486.4, type: "purchase", direction: "out", description: "Dining & entertainment" },
	{ day: 15, account: "checking", amount: 214.3, type: "purchase", direction: "out", description: "Fuel & transport" },
	{ day: 20, account: "checking", amount: 96.4, type: "purchase", direction: "out", description: "Subscriptions — streaming & software" },
	{ day: 24, account: "checking", amount: 412, type: "withdrawal", direction: "out", description: "Home insurance" },
] satisfies RecurringSeed[]

const ONE_OFFS: {
	monthsAgo: number
	day: number
	account: AccountKey
	amount: number
	type: TransactionTypeEnum
	direction: "in" | "out"
	description: string
	status?: TransactionStatusEnum
}[] = [
	{ monthsAgo: 7, day: 14, account: "fixed", amount: 45_000, type: "withdrawal", direction: "out", description: "Index fund purchase" },
	{ monthsAgo: 5, day: 9, account: "savings", amount: 62_000, type: "deposit", direction: "in", description: "Wire in — property sale proceeds" },
	{ monthsAgo: 4, day: 22, account: "checking", amount: 32_000, type: "withdrawal", direction: "out", description: "Vehicle purchase" },
	{ monthsAgo: 3, day: 6, account: "checking", amount: 42_000, type: "deposit", direction: "in", description: "Annual performance bonus" },
	{ monthsAgo: 2, day: 11, account: "checking", amount: 7_800, type: "purchase", direction: "out", description: "Travel — Lisbon" },
	{ monthsAgo: 2, day: 27, account: "checking", amount: 5_000, type: "withdrawal", direction: "out", description: "Charity donation" },
	{ monthsAgo: 1, day: 8, account: "checking", amount: 6_400, type: "deposit", direction: "in", description: "Tax refund" },
	// Money sent in by other people: three payers, all on the 23rd of this month,
	// 99,634.75 in total. These are inflows, so they raise the balance.
	{ monthsAgo: 0, day: 23, account: "checking", amount: 43_140, type: "deposit", direction: "in", description: "Wire in — Daniel Whitaker" },
	{ monthsAgo: 0, day: 23, account: "checking", amount: 32_675.5, type: "deposit", direction: "in", description: "Payment from Emily Carter — invoice 2184" },
	{ monthsAgo: 0, day: 23, account: "checking", amount: 23_819.25, type: "deposit", direction: "in", description: "Zelle from Marcus Bell" },
	{ monthsAgo: 1, day: 19, account: "euro", amount: 2_100, type: "withdrawal", direction: "out", description: "Brussels rent" },
	{ monthsAgo: 1, day: 21, account: "euro", amount: 3_400, type: "deposit", direction: "in", description: "Client payment — EUR" },
	{ monthsAgo: 0, day: 2, account: "euro", amount: 480, type: "purchase", direction: "out", description: "Hotel — Brussels" },
] satisfies OneOffSeed[]

const RECENT: {
	days: number
	hour?: number
	minute?: number
	account: AccountKey
	amount: number
	type: TransactionTypeEnum
	direction: "in" | "out"
	description: string
	status?: TransactionStatusEnum
}[] = [
	// `days: 0` is today; nothing is dated later than that.
	{ days: 0, account: "checking", amount: 2_300, type: "deposit", direction: "in", description: "Zelle from Tori Williams" },
	// Today's large withdrawals: 8 payments sent out between noon and 4pm,
	// 900,000.00 in total (350,000.00 from checking, 550,000.00 from savings).
	// All are withdrawals so they count as money out, not internal transfers.
	{ days: 0, hour: 12, minute: 7, account: "checking", amount: 124_860, type: "withdrawal", direction: "out", description: "Withdrawal to Michael Brennan" },
	{ days: 0, hour: 12, minute: 38, account: "checking", amount: 86_275, type: "withdrawal", direction: "out", description: "Withdrawal to Hayley Brooks" },
	{ days: 0, hour: 13, minute: 14, account: "checking", amount: 97_400, type: "withdrawal", direction: "out", description: "Crypto withdrawal — Bitcoin wallet bc1q4f8y2k9m3" },
	{ days: 0, hour: 13, minute: 52, account: "checking", amount: 41_465, type: "withdrawal", direction: "out", description: "Withdrawal to Derek Coleman" },
	{ days: 0, hour: 14, minute: 21, account: "savings", amount: 178_320, type: "withdrawal", direction: "out", description: "Withdrawal to Jennifer Aldridge" },
	{ days: 0, hour: 14, minute: 58, account: "savings", amount: 152_680, type: "withdrawal", direction: "out", description: "Crypto withdrawal — Ethereum wallet 0x7d3a9c41b8" },
	{ days: 0, hour: 15, minute: 26, account: "savings", amount: 118_000, type: "withdrawal", direction: "out", description: "Withdrawal to Travis Whitfield" },
	{ days: 0, hour: 15, minute: 59, account: "savings", amount: 101_000, type: "withdrawal", direction: "out", description: "Crypto withdrawal — USDC wallet 0x2b6e8f05d1" },
	{ days: 1, account: "checking", amount: 1_290, type: "purchase", direction: "out", description: "Apple Store — MacBook" },
	{ days: 2, account: "checking", amount: 240.5, type: "purchase", direction: "out", description: "Groceries — Trader Joe's" },
]

function buildLedger(): EntrySeed[] {
	const seeds: EntrySeed[] = []

	// A full year of recurring activity so the dashboard can chart 12 months.
	for (let monthsAgo = 0; monthsAgo < 12; monthsAgo++) {
		for (const item of RECURRING) {
			const date = dateInMonth(monthsAgo, item.day)
			if (!date) continue
			seeds.push({
				account: item.account,
				date,
				amount: item.amount,
				type: item.type,
				direction: item.direction,
				description: item.description,
			})
		}

		// Transfers are double-entry so both balances stay consistent.
		const savingsDate = dateInMonth(monthsAgo, 16)
		if (savingsDate) {
			seeds.push({
				account: "checking",
				date: savingsDate,
				amount: 6_000,
				type: "transfer",
				direction: "out",
				description: "Transfer to high-yield savings",
			})
			seeds.push({
				account: "savings",
				date: savingsDate,
				amount: 6_000,
				type: "transfer",
				direction: "in",
				description: "Transfer from everyday checking",
			})
		}

		const fixedDate = dateInMonth(monthsAgo, 18)
		if (fixedDate) {
			seeds.push({
				account: "checking",
				date: fixedDate,
				amount: 4_500,
				type: "transfer",
				direction: "out",
				description: "Monthly deposit to fixed deposit",
			})
			seeds.push({
				account: "fixed",
				date: fixedDate,
				amount: 4_500,
				type: "transfer",
				direction: "in",
				description: "Monthly deposit from everyday checking",
			})
		}
	}

	for (const entry of ONE_OFFS) {
		const date = dateInMonth(entry.monthsAgo, entry.day)
		if (!date) continue
		seeds.push({ ...entry, date })
	}

	for (const entry of RECENT) {
		seeds.push({
			account: entry.account,
			date: daysAgo(entry.days, entry.hour ?? 9 + entry.days, entry.minute),
			amount: entry.amount,
			type: entry.type,
			direction: entry.direction,
			description: entry.description,
			status: entry.status,
		})
	}

	return seeds
}

const seeds = buildLedger()

/** Closing balance for every demo account, derived from the opening balance + ledger. */
const closingBalances = seeds.reduce<Record<string, number>>((balances, entry) => {
	const account = accountSeeds[entry.account]
	const signed = entry.direction === "in" ? entry.amount : -entry.amount
	balances[account.id] = (balances[account.id] ?? account.opening) + signed
	return balances
}, {})

export const DEMO_USER: User = {
	id: "demo-user",
	name: "Gloria Morgan",
	email: "gloria.morgan@gmail.com",
	emailVerified: true,
	image: null,
	blocked: false,
	twoFactorEnabled: false,
	admin: false,
	hashedTransactionPin: null,
	createdAt: new Date("2023-02-08T09:00:00.000Z"),
	updatedAt: daysAgo(1),
}

export const DEMO_TRANSACTIONS: DemoTransaction[] = seeds
	.map((entry, index) => {
		const account = accountSeeds[entry.account]

		return {
			id: `demo-tx-${String(index + 1).padStart(3, "0")}`,
			userId: DEMO_USER.id,
			accountId: account.id,
			amount: entry.amount.toFixed(2),
			type: entry.type,
			status: entry.status ?? "completed",
			description: entry.description,
			transactionRef: `TRX-D${String(index + 1).padStart(4, "0")}`,
			createdAt: entry.date,
			updatedAt: entry.date,
			direction: entry.direction,
		} satisfies DemoTransaction
	})
	.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

export const DEMO_ACCOUNTS: BankAccount[] = Object.values(accountSeeds).map((account) => ({
	id: account.id,
	userId: DEMO_USER.id,
	accountNumber: account.accountNumber,
	accountType: account.accountType,
	balance: (closingBalances[account.id] ?? account.opening).toFixed(2),
	currency: account.currency,
	bankName: account.bankName,
	branchName: account.branchName,
	accountName: account.accountName,
	status: "active",
	isPrimary: account.isPrimary,
	createdAt: account.createdAt,
	updatedAt: daysAgo(1),
}))

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
	createdAt: new Date("2023-02-08T09:05:00.000Z"),
	updatedAt: daysAgo(10),
}

export const DEMO_SESSIONS: Session[] = [
	{
		id: "demo-session-laptop",
		expiresAt: daysAgo(-6),
		token: "demo-token-laptop",
		createdAt: demoLastSignIn(),
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
	{
		id: "demo-session-tablet",
		expiresAt: daysAgo(-2),
		token: "demo-token-tablet",
		createdAt: daysAgo(9, 13),
		updatedAt: daysAgo(3, 13),
		ipAddress: "192.168.0.44",
		userAgent: "Safari on iPad",
		userId: DEMO_USER.id,
	},
]

/** Mirrors the filters accepted by `getTransactionsAction`, applied in memory. */
export function filterDemoTransactions(filters?: {
	type?: string
	status?: string
	search?: string
}): DemoTransaction[] {
	const search = filters?.search?.toLowerCase()

	return DEMO_TRANSACTIONS.filter((transaction) => {
		if (filters?.type && transaction.type !== filters.type) return false
		if (filters?.status && transaction.status !== filters.status) return false
		if (search && !(transaction.description ?? "").toLowerCase().includes(search)) return false
		return true
	})
}
