// Monthly statements per currency, reconciled against the account balances.
import Link from "next/link"
import { DEMO_ACCOUNTS, DEMO_TRANSACTIONS } from "@/lib/demo"
import { buildStatements } from "@/lib/statements"
import { formatCurrency } from "@/lib/format"
import type { BankAccount, Transaction } from "@/types/db"
import StatementsPanel from "@/components/dashboard/StatementsPanel"

export default function StatementsPage() {
	const accounts: BankAccount[] = DEMO_ACCOUNTS
	const transactions: Transaction[] = DEMO_TRANSACTIONS
	const displayCurrency: string | null = null

	const primaryAccount = accounts.find((account) => account.isPrimary) ?? accounts[0]
	const currency = displayCurrency ?? primaryAccount?.currency ?? "USD"
	const statements = buildStatements(transactions, accounts, currency, 6)

	// Statements are per currency, so the CSV rows must be scoped the same way.
	const currencyAccountIds = new Set(
		accounts.filter((account) => account.currency === currency).map((account) => account.id)
	)
	const scopedTransactions = transactions.filter((transaction) =>
		currencyAccountIds.has(transaction.accountId)
	)
	const current = statements[0]
	const ready = statements.filter((statement) => statement.status === "ready").length

	return (
		<>
			<header className="flex flex-col gap-2">
				<p className="text-[10px] font-medium uppercase tracking-[0.2em] text-green-80">
					Statements
				</p>
				<h1 className="text-2xl md:text-3xl font-semibold text-white">Statements & reports</h1>
				<p className="text-sm text-gray-20">
					Every monthly statement for your {currency} accounts, ready to download as CSV.
				</p>
			</header>

			<section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div className="flex flex-col gap-1 rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6">
					<span className="text-[10px] uppercase tracking-[0.2em] text-gray-30">
						Current balance
					</span>
					<span className="text-xl font-semibold text-green-80">
						{formatCurrency(current?.closing ?? 0, currency)}
					</span>
				</div>
				<div className="flex flex-col gap-1 rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6">
					<span className="text-[10px] uppercase tracking-[0.2em] text-gray-30">
						This month
					</span>
					<span className="text-xl font-semibold text-white">
						{formatCurrency(current?.inflow ?? 0, currency)}{" "}
						<span className="text-sm font-normal text-gray-30">in</span>
					</span>
					<span className="text-xs text-gray-30">
						{formatCurrency(current?.outflow ?? 0, currency)} out · {current?.count ?? 0}{" "}
						entries
					</span>
				</div>
				<div className="flex flex-col gap-1 rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6">
					<span className="text-[10px] uppercase tracking-[0.2em] text-gray-30">
						Available statements
					</span>
					<span className="text-xl font-semibold text-white">{ready}</span>
					<span className="text-xs text-gray-30">Closed periods ready to download</span>
				</div>
			</section>

			<StatementsPanel
				statements={statements}
				transactions={scopedTransactions}
				currency={currency}
			/>

			<section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6">
				<div className="flex flex-col gap-1">
					<h2 className="text-sm font-semibold text-white">Need a different export?</h2>
					<p className="text-xs text-gray-30">
						Filter transactions by type, status or description, then export exactly that view.
					</p>
				</div>
				<Link href="/dashboard/transactions" className="default-button-alt text-white">
					Open transactions
				</Link>
			</section>
		</>
	)
}
