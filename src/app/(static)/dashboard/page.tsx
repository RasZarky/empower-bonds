"use client"

import Link from "next/link"
import {
	RiArrowRightLine,
	RiArrowUpLine,
	RiBankCardLine,
	RiExchangeDollarLine,
	RiPieChartLine,
} from "react-icons/ri"
import {
	DEMO_ACCOUNTS,
	DEMO_PREFERENCE,
	DEMO_TRANSACTIONS,
	DEMO_USER,
	demoLastSignIn,
} from "@/lib/demo"
import type { BankAccount, Transaction } from "@/types/db"
import {
	isIncome,
	isTransfer,
	monthlyCashFlow,
	summarizeTransactions,
	transactionAmount,
	transactionDirection,
	withinDays,
} from "@/lib/finance"
import { formatCurrency, formatDate, maskAccountNumber } from "@/lib/format"
import { convertAmount } from "@/lib/rates"
import { useExchangeRates } from "@/hooks/useExchangeRates"
import StatCard from "@/components/dashboard/StatCard"
import CashFlowChart from "@/components/dashboard/CashFlowChart"
import TransferDialog from "@/components/dashboard/TransferDialog"

const statusStyles: Record<string, string> = {
	completed: "text-green-80 bg-green-80/10 border-green-80/30",
	pending: "text-gray-20 bg-gray-80 border-gray-60",
	failed: "text-red-400 bg-red-400/10 border-red-400/30",
	cancelled: "text-gray-20 bg-gray-80 border-gray-60",
	refunded: "text-gray-20 bg-gray-80 border-gray-60",
}

export default function DashboardOverviewPage() {
	// The exported site is the read-only sample account: every value comes from
	// the local demo ledger, so no session, cookies or database are involved.
	const accounts: BankAccount[] = DEMO_ACCOUNTS
	const transactions: Transaction[] = DEMO_TRANSACTIONS
	const hideBalances = DEMO_PREFERENCE.hideBalances
	const { rates, live: liveRates, updatedAt } = useExchangeRates()

	const lastLogin: Date | null = demoLastSignIn()

	const totalByCurrency = accounts.reduce<Record<string, number>>((totals, account) => {
		const amount = Number.parseFloat(account.balance)
		totals[account.currency] =
			(totals[account.currency] ?? 0) + (Number.isFinite(amount) ? amount : 0)
		return totals
	}, {})

	const primaryAccount = accounts.find((account) => account.isPrimary) ?? accounts[0]
	const primaryCurrency = primaryAccount?.currency ?? "USD"
	const currencyByAccount = new Map(accounts.map((account) => [account.id, account.currency]))

	// The headline total covers every account, so foreign-currency balances are
	// converted into the primary currency instead of being dropped from it.
	const portfolio = Object.entries(totalByCurrency).reduce(
		(total, [currency, amount]) =>
			total + convertAmount(amount, currency, primaryCurrency, rates),
		0
	)
	const otherCurrencies = Object.entries(totalByCurrency).filter(
		([currency]) => currency !== primaryCurrency
	)
	const rateForDisplay = (transaction: Transaction) =>
		convertAmount(
			1,
			currencyByAccount.get(transaction.accountId) ?? primaryCurrency,
			primaryCurrency,
			rates
		)

	const last30 = summarizeTransactions(withinDays(transactions, 30), rateForDisplay)
	const cashFlow = monthlyCashFlow(transactions, 12, rateForDisplay)
	const recent = transactions.slice(0, 8)
	const firstName = DEMO_USER.name.split(" ")[0]

	return (
		<>
			<header className="flex flex-col gap-2">
				<p className="text-[10px] font-medium uppercase tracking-[0.2em] text-green-80">
					Dashboard
				</p>
				<h1 className="text-2xl md:text-3xl font-semibold text-white">
					Welcome back, {firstName}
				</h1>
				<p className="text-sm text-gray-20">
					Here is a summary of your accounts and recent activity.
				</p>
			</header>

			<section className="rounded-xl border-[0.5px] border-gray-70 bg-gradient-to-br from-gray-90 to-green-90 p-6 md:p-8 flex flex-col gap-6">
				<div className="flex flex-wrap items-start justify-between gap-6">
					<div className="flex flex-col gap-2">
						<span className="text-[10px] uppercase tracking-[0.2em] text-gray-30">
							Total portfolio value
						</span>
						<span className="text-3xl md:text-4xl font-semibold text-green-80 break-words">
							{hideBalances ? "••••••" : formatCurrency(portfolio, primaryCurrency)}
						</span>
						{otherCurrencies.length > 0 && (
							<span className="text-xs text-gray-30">
								All accounts, with{" "}
								{otherCurrencies.map(([currency]) => currency).join(" and ")} converted into{" "}
								{primaryCurrency} at {liveRates ? "live rates" : "demo exchange rates"}
								{liveRates && updatedAt ? ` · updated ${formatDate(updatedAt)}` : ""}.
							</span>
						)}
						<span
							className={`flex w-fit items-center gap-1 rounded-full border-[0.5px] px-2 py-1 text-[10px] ${
								last30.net >= 0
									? "border-green-80/30 bg-green-80/10 text-green-80"
									: "border-red-400/30 bg-red-400/10 text-red-400"
							}`}
						>
							<RiArrowUpLine className="h-3 w-3" />
							{last30.net >= 0 ? "+" : "−"}
							{formatCurrency(Math.abs(last30.net), primaryCurrency)} net · last 30 days
						</span>
					</div>

					<div className="flex flex-col gap-2">
						<span className="text-[10px] uppercase tracking-[0.2em] text-gray-30">
							Across currencies
						</span>
						{Object.entries(totalByCurrency).map(([currency, total]) => (
							<span key={currency} className="text-sm text-gray-20">
								<span className="text-white">{currency}</span>{" "}
								{hideBalances ? "••••••" : formatCurrency(total, currency)}
							</span>
						))}
						{otherCurrencies.length === 0 && (
							<span className="text-xs text-gray-30">Single-currency portfolio</span>
						)}
					</div>
				</div>

				<div className="flex flex-wrap gap-3 border-t border-gray-70 pt-6">
					<TransferDialog
						userId={DEMO_USER.id}
						demo
						accounts={accounts.map((account) => ({
							id: account.id,
							name: account.accountName ?? "Account",
							balance: account.balance,
							currency: account.currency,
						}))}
					/>
					<Link href="/dashboard/transactions" className="default-button-alt text-white">
						View transactions
					</Link>
					<Link href="/dashboard/accounts" className="default-button-alt text-white">
						Manage accounts
					</Link>
					<Link href="/dashboard/settings" className="default-button-alt text-white">
						Preferences
					</Link>
				</div>
			</section>

			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				<StatCard
					label="Money in · 30d"
					value={formatCurrency(last30.income, primaryCurrency)}
					hint="Deposits and sales"
					icon={<RiArrowUpLine className="h-5 w-5" />}
				/>
				<StatCard
					label="Money out · 30d"
					value={formatCurrency(last30.expenses, primaryCurrency)}
					hint="Payments, fees and withdrawals"
					icon={<RiExchangeDollarLine className="h-5 w-5" />}
				/>
				<StatCard
					label="Savings rate"
					value={last30.savingsRate === null ? "—" : `${last30.savingsRate}%`}
					hint="Share of income kept, last 30 days"
					icon={<RiPieChartLine className="h-5 w-5" />}
				/>
				<StatCard
					label="Accounts"
					value={accounts.length}
					hint={`Last sign-in ${formatDate(lastLogin)}`}
					icon={<RiBankCardLine className="h-5 w-5" />}
				/>
			</div>

			<section className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6">
				<div className="flex flex-wrap items-end justify-between gap-4 pb-6">
					<div className="flex flex-col gap-1">
						<h2 className="text-lg font-semibold text-white">Cash flow</h2>
						<p className="text-xs text-gray-30">
							Income and expenses over the last twelve months (six on small screens),
							excluding transfers between your accounts.
						</p>
					</div>
					<div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.15em] text-gray-30">
						<span className="flex items-center gap-2">
							<span className="h-2 w-4 rounded-full bg-green-80" /> In
						</span>
						<span className="flex items-center gap-2">
							<span className="h-2 w-4 rounded-full bg-gray-50" /> Out
						</span>
					</div>
				</div>

				<CashFlowChart buckets={cashFlow} currency={primaryCurrency} />
			</section>

			<section className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90">
				<div className="flex items-center justify-between gap-4 p-6">
					<div className="flex flex-col gap-1">
						<h2 className="text-lg font-semibold text-white">Your accounts</h2>
						<p className="text-xs text-gray-30">Share of your portfolio by currency.</p>
					</div>
					<Link
						href="/dashboard/accounts"
						className="flex items-center gap-2 text-xs font-medium text-green-80 hover:text-green-70 transition-colors duration-300"
					>
						Manage
						<RiArrowRightLine className="h-4 w-4" />
					</Link>
				</div>

				{accounts.length === 0 ? (
					<div className="border-t border-gray-70 p-6 flex flex-col items-start gap-4">
						<p className="text-sm text-gray-20">
							You do not have a bank account yet. Open one to start transacting.
						</p>
						<Link href="/dashboard/accounts" className="default-button">
							View accounts
						</Link>
					</div>
				) : (
					<ul className="border-t border-gray-70 divide-y divide-gray-70">
						{accounts.map((account) => {
							const currencyTotal = totalByCurrency[account.currency] ?? 0
							const balance = Number.parseFloat(account.balance)
							const share =
								currencyTotal > 0 && Number.isFinite(balance)
									? Math.round((balance / currencyTotal) * 100)
									: 0

							return (
								<li key={account.id} className="flex flex-col gap-3 p-6">
									<div className="flex items-center justify-between gap-4">
										<div className="flex flex-col gap-1 min-w-0">
											<span className="text-sm font-medium text-white truncate">
												{account.accountName ?? "Account"}
												{account.isPrimary && (
													<span className="ml-2 rounded-full border-[0.5px] border-green-80/40 px-2 py-0.5 text-[9px] uppercase tracking-wider text-green-80">
														Primary
													</span>
												)}
											</span>
											<span className="text-xs text-gray-30">
												{account.accountType.replace(/_/g, " ")} ·{" "}
												{maskAccountNumber(account.accountNumber)}
											</span>
										</div>
										<span className="text-sm font-semibold text-green-80 whitespace-nowrap">
											{hideBalances
												? "••••••"
												: formatCurrency(account.balance, account.currency)}
										</span>
									</div>

									<div className="flex items-center gap-3">
										<div className="h-1 w-full overflow-hidden rounded-full bg-gray-70">
											<div
												className="h-1 rounded-full bg-green-80"
												style={{ width: `${Math.min(100, share)}%` }}
											/>
										</div>
										<span className="w-10 shrink-0 text-right text-[10px] text-gray-30">
											{share}%
										</span>
									</div>
								</li>
							)
						})}
					</ul>
				)}
			</section>

			<section className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90">
				<div className="flex items-center justify-between gap-4 p-6">
					<div className="flex flex-col gap-1">
						<h2 className="text-lg font-semibold text-white">Recent activity</h2>
						<p className="text-xs text-gray-30">Your latest transactions.</p>
					</div>
					<Link
						href="/dashboard/transactions"
						className="flex items-center gap-2 text-xs font-medium text-green-80 hover:text-green-70 transition-colors duration-300"
					>
						View all
						<RiArrowRightLine className="h-4 w-4" />
					</Link>
				</div>

				{recent.length === 0 ? (
					<div className="border-t border-gray-70 p-6">
						<p className="text-sm text-gray-20">
							No transactions yet. Once you deposit or withdraw, activity shows up here.
						</p>
					</div>
				) : (
					<div className="border-t border-gray-70 overflow-x-auto">
						<table className="w-full min-w-[520px] text-left text-sm">
							<thead>
								<tr className="text-[10px] uppercase tracking-[0.2em] text-gray-30">
									<th className="px-6 py-3 font-medium">Date</th>
									<th className="px-6 py-3 font-medium">Description</th>
									<th className="px-6 py-3 font-medium">Status</th>
									<th className="px-6 py-3 font-medium text-right">Amount</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-70">
								{recent.map((transaction) => {
									const incoming = transactionDirection(transaction) === "in"
									const transfer = isTransfer(transaction)

									return (
										<tr key={transaction.id}>
											<td className="px-6 py-4 text-gray-20 whitespace-nowrap">
												{formatDate(transaction.createdAt)}
											</td>
											<td className="px-6 py-4 text-white">
												{transaction.description || "—"}
												<span className="ml-2 text-[10px] uppercase tracking-wider text-gray-30">
													{transaction.type}
												</span>
											</td>
											<td className="px-6 py-4">
												<span
													className={`rounded-full border-[0.5px] px-2 py-1 text-[10px] uppercase tracking-wider ${
														statusStyles[transaction.status] ?? statusStyles.pending
													}`}
												>
													{transaction.status}
												</span>
											</td>
											<td
												className={`px-6 py-4 text-right font-semibold whitespace-nowrap ${
													incoming && !transfer
														? "text-green-80"
														: "text-gray-20"
												}`}
											>
												{transfer ? "" : incoming ? "+" : isIncome(transaction) ? "+" : "−"}
												{formatCurrency(
													transactionAmount(transaction),
													currencyByAccount.get(transaction.accountId) ?? primaryCurrency
												)}
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				)}
			</section>
		</>
	)
}
