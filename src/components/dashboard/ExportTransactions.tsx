"use client"

import { toast } from "sonner"
import { RiDownloadLine } from "react-icons/ri"
import { downloadTextFile, toCsv } from "@/lib/csv"
import type { Transaction } from "@/types/db"

export default function ExportTransactions({
	transactions,
	currency = "USD",
}: {
	transactions: Transaction[]
	currency?: string
}) {
	const exportCsv = () => {
		if (transactions.length === 0) {
			toast.error("Nothing to export", {
				description: "There are no transactions in this view.",
			})
			return
		}

		const csv = toCsv([
			["Date", "Description", "Reference", "Type", "Status", "Amount", "Currency"],
			...transactions.map((transaction) => [
				new Date(transaction.createdAt).toISOString(),
				transaction.description ?? "",
				transaction.transactionRef ?? "",
				transaction.type,
				transaction.status,
				Number.parseFloat(transaction.amount).toFixed(2),
				currency,
			]),
		])

		downloadTextFile(
			`empower-bonds-transactions-${new Date().toISOString().slice(0, 10)}.csv`,
			csv
		)

		toast.success("Export ready", {
			description: `${transactions.length} transactions downloaded.`,
		})
	}

	return (
		<button
			type="button"
			onClick={exportCsv}
			className="flex items-center gap-2 rounded-full border-[0.5px] border-gray-70 px-4 py-2 text-xs font-medium text-gray-20 transition-colors duration-300 hover:border-green-80 hover:text-green-80"
		>
			<RiDownloadLine className="h-4 w-4" />
			Export CSV
		</button>
	)
}
