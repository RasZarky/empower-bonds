"use client"

import { useState } from "react"
import Link from "next/link"
import { DEMO_ACCOUNTS, filterDemoTransactions } from "@/lib/demo"
import type { Transaction, TransactionStatusEnum, TransactionTypeEnum } from "@/types/db"
import {
	isTransfer,
	summarizeTransactions,
	transactionAmount,
	transactionDirection,
} from "@/lib/finance"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { convertAmount } from "@/lib/rates"
import { useExchangeRates } from "@/hooks/useExchangeRates"
import ExportTransactions from "@/components/dashboard/ExportTransactions"

const transactionTypes = [
	"deposit",
	"withdrawal",
	"purchase",
	"sale",
	"fee",
	"transfer",
] as const

const transactionStatuses = [
	"pending",
	"completed",
	"failed",
	"cancelled",
	"refunded",
] as const

const statusStyles: Record<string, string> = {
	completed: "text-green-80 bg-green-80/10 border-green-80/30",
	pending: "text-gray-20 bg-gray-80 border-gray-60",
	failed: "text-red-400 bg-red-400/10 border-red-400/30",
	cancelled: "text-gray-20 bg-gray-80 border-gray-60",
	refunded: "text-gray-20 bg-gray-80 border-gray-60",
}

const controlClassName =
	"h-9 rounded-full border-[0.5px] border-gray-80 bg-gray-90 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-80"

export default function TransactionsPage() {
	// Filtering happens in the browser because the exported site has no server.
	const [typeFilter, setTypeFilter] = useState("")
	const [statusFilter, setStatusFilter] = useState("")
	const [searchFilter, setSearchFilter] = useState("")
	const { rates } = useExchangeRates()

	const type = transactionTypes.includes(typeFilter as (typeof transactionTypes)[number])
		? (typeFilter as TransactionTypeEnum)
		: undefined
	const status = transactionStatuses.includes(
		statusFilter as (typeof transactionStatuses)[number]
	)
		? (statusFilter as TransactionStatusEnum)
		: undefined
	const search = searchFilter.trim() || undefined

	const transactions: Transaction[] = filterDemoTransactions({ type, status, search })
	const loadError: string | undefined = undefined
	const hasFilters = Boolean(type || status || search)

	// Amounts are entered in each account's own currency, so the summary cards
	// convert foreign rows into the primary currency to keep one total.
	const primaryCurrency =
		DEMO_ACCOUNTS.find((account) => account.isPrimary)?.currency ?? "USD"
	const currencyByAccount = new Map(
		DEMO_ACCOUNTS.map((account) => [account.id, account.currency])
	)
	const pageSummary = summarizeTransactions(transactions, (transaction) =>
		convertAmount(
			1,
			currencyByAccount.get(transaction.accountId) ?? primaryCurrency,
			primaryCurrency,
			rates
		)
	)

	const resetFilters = () => {
		setTypeFilter("")
		setStatusFilter("")
		setSearchFilter("")
	}

	return (
		<>
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div className="flex flex-col gap-2">
					<p className="text-[10px] font-medium uppercase tracking-[0.2em] text-green-80">
						Transactions
					</p>
					<h1 className="text-2xl md:text-3xl font-semibold text-white">
						Transaction history
					</h1>
					<p className="text-sm text-gray-20">
						Search and filter every movement on your accounts.
					</p>
				</div>
				<div className="flex items-center gap-4">
					<ExportTransactions transactions={transactions} />
					<Link
						href="/dashboard/statements"
						className="text-xs font-medium text-green-80 transition-colors duration-300 hover:text-green-70"
					>
						Statements
					</Link>
				</div>
			</header>

			<div className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6 flex flex-wrap items-end gap-3">
				<label className="flex flex-col gap-1.5">
					<span className="text-[10px] uppercase tracking-[0.2em] text-gray-30">Search</span>
					<input
						type="search"
						value={searchFilter}
						onChange={(event) => setSearchFilter(event.target.value)}
						placeholder="Description"
						className={`${controlClassName} w-full sm:w-56`}
					/>
				</label>

				<label className="flex flex-col gap-1.5">
					<span className="text-[10px] uppercase tracking-[0.2em] text-gray-30">Type</span>
					<select
						value={typeFilter}
						onChange={(event) => setTypeFilter(event.target.value)}
						className={controlClassName}
					>
						<option value="">All types</option>
						{transactionTypes.map((value) => (
							<option key={value} value={value}>
								{value}
							</option>
						))}
					</select>
				</label>

				<label className="flex flex-col gap-1.5">
					<span className="text-[10px] uppercase tracking-[0.2em] text-gray-30">Status</span>
					<select
						value={statusFilter}
						onChange={(event) => setStatusFilter(event.target.value)}
						className={controlClassName}
					>
						<option value="">All statuses</option>
						{transactionStatuses.map((value) => (
							<option key={value} value={value}>
								{value}
							</option>
						))}
					</select>
				</label>

				{hasFilters && (
					<button type="button" onClick={resetFilters} className="default-button-alt">
						Reset
					</button>
				)}
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6 flex flex-col gap-1">
					<span className="text-[10px] uppercase tracking-[0.2em] text-gray-30">Money in</span>
					<span className="text-lg font-semibold text-green-80">
						{formatCurrency(pageSummary.income, primaryCurrency)}
					</span>
				</div>
				<div className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6 flex flex-col gap-1">
					<span className="text-[10px] uppercase tracking-[0.2em] text-gray-30">Money out</span>
					<span className="text-lg font-semibold text-white">
						{formatCurrency(pageSummary.expenses, primaryCurrency)}
					</span>
				</div>
				<div className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6 flex flex-col gap-1">
					<span className="text-[10px] uppercase tracking-[0.2em] text-gray-30">Net</span>
					<span
						className={`text-lg font-semibold ${
							pageSummary.net >= 0 ? "text-green-80" : "text-red-400"
						}`}
					>
						{pageSummary.net >= 0 ? "+" : "−"}
						{formatCurrency(Math.abs(pageSummary.net), primaryCurrency)}
					</span>
				</div>
			</div>

			<section className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90 overflow-hidden">
				{loadError ? (
					<p className="p-6 text-sm text-red-400">{loadError}</p>
				) : transactions.length === 0 ? (
					<p className="p-6 text-sm text-gray-20">
						{hasFilters
							? "No transactions match these filters."
							: "No transactions yet. Deposits and withdrawals will appear here."}
					</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[640px] text-left text-sm">
							<thead>
								<tr className="text-[10px] uppercase tracking-[0.2em] text-gray-30">
									<th className="px-6 py-4 font-medium">Date</th>
									<th className="px-6 py-4 font-medium">Description</th>
									<th className="px-6 py-4 font-medium">Reference</th>
									<th className="px-6 py-4 font-medium">Type</th>
									<th className="px-6 py-4 font-medium">Status</th>
									<th className="px-6 py-4 font-medium text-right">Amount</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-70 border-t border-gray-70">
								{transactions.map((transaction) => (
									<tr key={transaction.id}>
										<td className="px-6 py-4 text-gray-20 whitespace-nowrap">
											{formatDateTime(transaction.createdAt)}
										</td>
										<td className="px-6 py-4 text-white">
											{transaction.description || "—"}
										</td>
										<td className="px-6 py-4 text-xs text-gray-30">
											{transaction.transactionRef || "—"}
										</td>
										<td className="px-6 py-4 capitalize text-gray-20">
											{transaction.type}
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
												!isTransfer(transaction) &&
												transactionDirection(transaction) === "in"
													? "text-green-80"
													: "text-gray-20"
											}`}
										>
											{isTransfer(transaction)
												? ""
												: transactionDirection(transaction) === "in"
													? "+"
													: "−"}
											{formatCurrency(
												transactionAmount(transaction),
												currencyByAccount.get(transaction.accountId) ?? primaryCurrency
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>

		</>
	)
}
