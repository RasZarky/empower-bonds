import Link from "next/link"
import { redirect } from "next/navigation"
import { getDashboardViewer } from "@/lib/dashboard-session"
import { getTransactionsAction } from "@/server/action/transactionAction"
import { filterDemoTransactions } from "@/lib/demo"
import type { Transaction, TransactionStatusEnum, TransactionTypeEnum } from "@/types/db"
import { formatCurrency, formatDateTime } from "@/lib/format"

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

type SearchParams = Promise<{
	type?: string
	status?: string
	q?: string
	cursor?: string
}>

const statusStyles: Record<string, string> = {
	completed: "text-green-80 bg-green-80/10 border-green-80/30",
	pending: "text-gray-20 bg-gray-80 border-gray-60",
	failed: "text-red-400 bg-red-400/10 border-red-400/30",
	cancelled: "text-gray-20 bg-gray-80 border-gray-60",
	refunded: "text-gray-20 bg-gray-80 border-gray-60",
}

const controlClassName =
	"h-9 rounded-full border-[0.5px] border-gray-80 bg-gray-90 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-80"

export default async function TransactionsPage({
	searchParams,
}: {
	searchParams: SearchParams
}) {
	const viewer = await getDashboardViewer()

	if (!viewer) {
		redirect("/auth/login?redirect=/dashboard/transactions")
	}

	const params = await searchParams

	const type = transactionTypes.includes(params.type as (typeof transactionTypes)[number])
		? (params.type as TransactionTypeEnum)
		: undefined
	const status = transactionStatuses.includes(
		params.status as (typeof transactionStatuses)[number]
	)
		? (params.status as TransactionStatusEnum)
		: undefined
	const search = params.q?.trim() || undefined

	let transactions: Transaction[]
	let hasNextPage = false
	let nextCursor: string | Date | number | null = null
	let loadError: string | undefined

	if (viewer.demo) {
		transactions = filterDemoTransactions({ type, status, search })
	} else {
		const result = await getTransactionsAction(
			viewer.userId,
			{ type, status, search },
			params.cursor,
			10
		)

		if (result.success === false) {
			loadError = result.error || "Could not load transactions."
			transactions = []
		} else {
			transactions = result.data?.data ?? []
			nextCursor = result.data?.nextCursor ?? null
			hasNextPage = result.data?.hasNextPage ?? false
		}
	}

	const pageParams = new URLSearchParams()
	if (type) pageParams.set("type", type)
	if (status) pageParams.set("status", status)
	if (search) pageParams.set("q", search)
	if (nextCursor) pageParams.set("cursor", String(nextCursor))

	const hasFilters = Boolean(type || status || search)

	return (
		<>
			<header className="flex flex-col gap-2">
				<p className="text-[10px] font-medium uppercase tracking-[0.2em] text-green-80">
					Transactions
				</p>
				<h1 className="text-2xl md:text-3xl font-semibold text-white">Transaction history</h1>
				<p className="text-sm text-gray-20">
					Search and filter every movement on your accounts.
				</p>
			</header>

			<form
				className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6 flex flex-wrap items-end gap-3"
				action="/dashboard/transactions"
				method="get"
			>
				<label className="flex flex-col gap-1.5">
					<span className="text-[10px] uppercase tracking-[0.2em] text-gray-30">Search</span>
					<input
						type="search"
						name="q"
						defaultValue={search ?? ""}
						placeholder="Description"
						className={`${controlClassName} w-full sm:w-56`}
					/>
				</label>

				<label className="flex flex-col gap-1.5">
					<span className="text-[10px] uppercase tracking-[0.2em] text-gray-30">Type</span>
					<select name="type" defaultValue={type ?? ""} className={controlClassName}>
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
					<select name="status" defaultValue={status ?? ""} className={controlClassName}>
						<option value="">All statuses</option>
						{transactionStatuses.map((value) => (
							<option key={value} value={value}>
								{value}
							</option>
						))}
					</select>
				</label>

				<button type="submit" className="default-button">
					Apply
				</button>

				{hasFilters && (
					<Link href="/dashboard/transactions" className="default-button-alt">
						Reset
					</Link>
				)}
			</form>

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
												transaction.type === "deposit"
													? "text-green-80"
													: "text-gray-20"
											}`}
										>
											{transaction.type === "deposit" ? "+" : "-"}
											{formatCurrency(transaction.amount)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>

			{hasNextPage && (
				<div className="flex justify-end">
					<Link
						href={`/dashboard/transactions?${pageParams.toString()}`}
						className="default-button-alt"
					>
						Older transactions
					</Link>
				</div>
			)}
		</>
	)
}
