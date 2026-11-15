"use client"

import { toast } from "sonner"
import { RiDownloadLine, RiFileTextLine } from "react-icons/ri"
import { downloadTextFile, toCsv } from "@/lib/csv"
import { formatCurrency, formatDate } from "@/lib/format"
import type { StatementPeriod } from "@/lib/statements"
import type { Transaction } from "@/types/db"

export default function StatementsPanel({
	statements,
	transactions,
	currency,
}: {
	statements: StatementPeriod[]
	transactions: Transaction[]
	currency: string
}) {
	const download = (statement: StatementPeriod) => {
		const start = new Date(statement.periodStart).getTime()
		const end = new Date(statement.periodEnd).getTime()
		const rows = transactions.filter((transaction) => {
			const time = new Date(transaction.createdAt).getTime()
			return time >= start && time <= end
		})

		const csv = toCsv([
			["Date", "Description", "Reference", "Type", "Status", "Amount", "Currency"],
			...rows.map((transaction) => [
				new Date(transaction.createdAt).toISOString().slice(0, 10),
				transaction.description ?? "",
				transaction.transactionRef ?? "",
				transaction.type,
				transaction.status,
				Number.parseFloat(transaction.amount).toFixed(2),
				currency,
			]),
		])

		const slug = statement.label.toLowerCase().replace(/\s+/g, "-")
		downloadTextFile(`empower-bonds-statement-${slug}.csv`, csv)
		toast.success("Statement downloaded", {
			description: `${statement.label} · ${rows.length} transactions`,
		})
	}

	if (statements.length === 0) {
		return (
			<div className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6">
				<p className="text-sm text-gray-20">No statements yet. They appear after your first month.</p>
			</div>
		)
	}

	return (
		<div className="overflow-hidden rounded-xl border-[0.5px] border-gray-70 bg-gray-90">
			<div className="hidden grid-cols-[1.4fr_repeat(4,1fr)_auto] gap-4 border-b border-gray-70 px-6 py-3 text-[10px] uppercase tracking-[0.2em] text-gray-30 lg:grid">
				<span>Period</span>
				<span className="text-right">Opening</span>
				<span className="text-right">In</span>
				<span className="text-right">Out</span>
				<span className="text-right">Closing</span>
				<span className="text-right">Download</span>
			</div>

			<ul className="divide-y divide-gray-70">
				{statements.map((statement) => (
					<li
						key={statement.key}
						className="grid grid-cols-1 gap-3 px-6 py-5 lg:grid-cols-[1.4fr_repeat(4,1fr)_auto] lg:items-center lg:gap-4"
					>
						<div className="flex items-center gap-3">
							<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[0.5px] border-gray-70 bg-gray-80 text-green-80">
								<RiFileTextLine className="h-4 w-4" />
							</span>
							<div className="flex flex-col">
								<span className="text-sm font-medium text-white">{statement.label}</span>
								<span className="text-[10px] text-gray-30">
									{formatDate(statement.periodStart)} – {formatDate(statement.periodEnd)} ·{" "}
									{statement.count} entries
								</span>
							</div>
						</div>

						<div className="grid grid-cols-4 gap-3 lg:contents">
							<div className="flex flex-col lg:items-end">
								<span className="text-[9px] uppercase tracking-[0.15em] text-gray-30 lg:hidden">
									Opening
								</span>
								<span className="text-xs text-gray-20">
									{formatCurrency(statement.opening, currency)}
								</span>
							</div>
							<div className="flex flex-col lg:items-end">
								<span className="text-[9px] uppercase tracking-[0.15em] text-gray-30 lg:hidden">
									In
								</span>
								<span className="text-xs text-green-80">
									+{formatCurrency(statement.inflow, currency)}
								</span>
							</div>
							<div className="flex flex-col lg:items-end">
								<span className="text-[9px] uppercase tracking-[0.15em] text-gray-30 lg:hidden">
									Out
								</span>
								<span className="text-xs text-gray-20">
									−{formatCurrency(statement.outflow, currency)}
								</span>
							</div>
							<div className="flex flex-col lg:items-end">
								<span className="text-[9px] uppercase tracking-[0.15em] text-gray-30 lg:hidden">
									Closing
								</span>
								<span className="text-xs font-semibold text-white">
									{formatCurrency(statement.closing, currency)}
								</span>
							</div>
						</div>

						<div className="flex items-center justify-between gap-3 lg:justify-end">
							<span
								className={`rounded-full border-[0.5px] px-2 py-1 text-[9px] uppercase tracking-wider lg:hidden ${
									statement.status === "current"
										? "border-gray-60 bg-gray-80 text-gray-20"
										: "border-green-80/30 bg-green-80/10 text-green-80"
								}`}
							>
								{statement.status === "current" ? "In progress" : "Ready"}
							</span>
							<button
								type="button"
								onClick={() => download(statement)}
								className="flex items-center gap-2 rounded-full border-[0.5px] border-gray-70 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-gray-20 transition-colors duration-300 hover:border-green-80 hover:text-green-80"
							>
								<RiDownloadLine className="h-3.5 w-3.5" />
								CSV
							</button>
						</div>
					</li>
				))}
			</ul>
		</div>
	)
}
