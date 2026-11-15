import Link from "next/link"
import { RiArrowRightLine } from "react-icons/ri"
import { DEMO_ACCOUNTS, DEMO_TRANSACTIONS, DEMO_USER } from "@/lib/demo"
import { buildCards } from "@/lib/cards"
import { formatCurrency, formatDateTime } from "@/lib/format"
import type { BankAccount, Transaction } from "@/types/db"
import CardsPanel from "@/components/dashboard/CardsPanel"

const statusStyles: Record<string, string> = {
	completed: "text-green-80 bg-green-80/10 border-green-80/30",
	pending: "text-gray-20 bg-gray-80 border-gray-60",
	failed: "text-red-400 bg-red-400/10 border-red-400/30",
}

export default function CardsPage() {
	const accounts: BankAccount[] = DEMO_ACCOUNTS
	const transactions: Transaction[] = DEMO_TRANSACTIONS

	const cards = buildCards(accounts, DEMO_USER.name)
	const cardAccountIds = new Set(cards.map((card) => card.accountId))
	const primaryCurrency =
		accounts.find((account) => account.isPrimary)?.currency ?? accounts[0]?.currency ?? "USD"

	const cardActivity = transactions
		.filter(
			(transaction) =>
				cardAccountIds.has(transaction.accountId) &&
				(transaction.type === "purchase" || transaction.type === "withdrawal")
		)
		.slice(0, 8)

	return (
		<>
			<header className="flex flex-col gap-2">
				<p className="text-[10px] font-medium uppercase tracking-[0.2em] text-green-80">
					Cards
				</p>
				<h1 className="text-2xl md:text-3xl font-semibold text-white">Your cards</h1>
				<p className="text-sm text-gray-20">
					Freeze a card instantly, reveal its details and review the limits attached to it.
				</p>
			</header>

			<CardsPanel cards={cards} />

			<section className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90">
				<div className="flex flex-wrap items-center justify-between gap-4 p-6">
					<div className="flex flex-col gap-1">
						<h2 className="text-lg font-semibold text-white">Recent card activity</h2>
						<p className="text-xs text-gray-30">Card payments and cash withdrawals.</p>
					</div>
					<Link
						href="/dashboard/transactions"
						className="flex items-center gap-2 text-xs font-medium text-green-80 transition-colors duration-300 hover:text-green-70"
					>
						All transactions
						<RiArrowRightLine className="h-4 w-4" />
					</Link>
				</div>

				{cardActivity.length === 0 ? (
					<p className="border-t border-gray-70 p-6 text-sm text-gray-20">
						No card activity yet. Payments will appear here as soon as you use a card.
					</p>
				) : (
					<ul className="divide-y divide-gray-70 border-t border-gray-70">
						{cardActivity.map((transaction) => (
							<li
								key={transaction.id}
								className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
							>
								<div className="flex min-w-0 flex-col gap-0.5">
									<span className="truncate text-sm text-white">
										{transaction.description || "Card payment"}
									</span>
									<span className="text-[10px] text-gray-30">
										{formatDateTime(transaction.createdAt)} ·{" "}
										{transaction.transactionRef || "—"}
									</span>
								</div>
								<div className="flex items-center gap-4">
									<span
										className={`rounded-full border-[0.5px] px-2 py-1 text-[10px] uppercase tracking-wider ${
											statusStyles[transaction.status] ?? statusStyles.pending
										}`}
									>
										{transaction.status}
									</span>
									<span className="text-sm font-semibold text-gray-20">
										−{formatCurrency(transaction.amount, primaryCurrency)}
									</span>
								</div>
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border-[0.5px] border-green-80/25 bg-green-80/5 p-6">
				<div className="flex flex-col gap-1">
					<h2 className="text-sm font-semibold text-white">Lost or stolen card?</h2>
					<p className="text-xs text-gray-20">
						Freeze it above straight away, then contact us to order a replacement.
					</p>
				</div>
				<Link href="/dashboard/support" className="default-button-alt text-white">
					Contact support
				</Link>
			</section>
		</>
	)
}
