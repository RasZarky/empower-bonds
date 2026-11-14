import Link from "next/link"
import { redirect } from "next/navigation"
import { RiArrowRightLine, RiBankCardLine, RiExchangeDollarLine, RiTimeLine } from "react-icons/ri"
import { getDashboardViewer } from "@/lib/dashboard-session"
import {
	getBankAccountsWithBalanceAction,
	getUserProfileDataAction,
} from "@/server/action/userAction"
import { getTransactionsAction } from "@/server/action/transactionAction"
import { DEMO_ACCOUNTS, DEMO_PREFERENCE, DEMO_SESSIONS, DEMO_TRANSACTIONS, DEMO_USER } from "@/lib/demo"
import type { BankAccount, Transaction } from "@/types/db"
import { formatCurrency, formatDate, maskAccountNumber } from "@/lib/format"
import StatCard from "@/components/dashboard/StatCard"

const statusStyles: Record<string, string> = {
	completed: "text-green-80 bg-green-80/10 border-green-80/30",
	pending: "text-gray-20 bg-gray-80 border-gray-60",
	failed: "text-red-400 bg-red-400/10 border-red-400/30",
	cancelled: "text-gray-20 bg-gray-80 border-gray-60",
	refunded: "text-gray-20 bg-gray-80 border-gray-60",
}

export default async function DashboardOverviewPage() {
	const viewer = await getDashboardViewer()

	if (!viewer) {
		redirect("/auth/login?redirect=/dashboard")
	}

	let accounts: BankAccount[]
	let transactions: Transaction[]
	let hideBalances: boolean
	let createdAt: Date | null
	let lastLogin: Date | null

	if (viewer.demo) {
		accounts = DEMO_ACCOUNTS
		transactions = DEMO_TRANSACTIONS.slice(0, 5)
		hideBalances = DEMO_PREFERENCE.hideBalances
		createdAt = DEMO_USER.createdAt
		lastLogin = DEMO_SESSIONS[0]?.createdAt ?? null
	} else {
		const [profileResult, accountsResult, transactionsResult] = await Promise.all([
			getUserProfileDataAction(viewer.userId),
			getBankAccountsWithBalanceAction(viewer.userId),
			getTransactionsAction(viewer.userId, undefined, undefined, 5),
		])

		accounts = accountsResult.data ?? []
		transactions = transactionsResult.data?.data ?? []
		hideBalances = profileResult.data?.preferences?.hideBalances ?? false
		createdAt = profileResult.data?.createdAt ?? null
		lastLogin = profileResult.data?.lastLogin ?? null
	}

	const primaryAccount = accounts.find((account) => account.isPrimary) ?? accounts[0]
	const primaryCurrency = primaryAccount?.currency ?? "USD"
	const totalBalance = accounts
		.filter((account) => account.currency === primaryCurrency)
		.reduce((total, account) => {
			const amount = Number.parseFloat(account.balance)
			return total + (Number.isFinite(amount) ? amount : 0)
		}, 0)

	const firstName = viewer.name?.split(" ")[0] || "there"

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

			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				<StatCard
					label="Total balance"
					value={hideBalances ? "••••••" : formatCurrency(totalBalance, primaryCurrency)}
					hint={`Across your ${primaryCurrency} accounts`}
					icon={<RiBankCardLine className="h-5 w-5" />}
				/>
				<StatCard
					label="Accounts"
					value={accounts.length}
					hint={accounts.length === 0 ? "No accounts yet" : `${primaryAccount?.status ?? "active"}`}
					icon={<RiBankCardLine className="h-5 w-5" />}
				/>
				<StatCard
					label="Last login"
					value={formatDate(lastLogin)}
					hint="Most recent session"
					icon={<RiTimeLine className="h-5 w-5" />}
				/>
				<StatCard
					label="Member since"
					value={formatDate(createdAt)}
					hint="Thank you for banking with us"
					icon={<RiExchangeDollarLine className="h-5 w-5" />}
				/>
			</div>

			<section className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90">
				<div className="flex items-center justify-between gap-4 p-6">
					<div className="flex flex-col gap-1">
						<h2 className="text-lg font-semibold text-white">Your accounts</h2>
						<p className="text-xs text-gray-30">Balances update with every transaction.</p>
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
							Open an account
						</Link>
					</div>
				) : (
					<ul className="border-t border-gray-70 divide-y divide-gray-70">
						{accounts.slice(0, 3).map((account) => (
							<li key={account.id} className="flex items-center justify-between gap-4 p-6">
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
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90">
				<div className="flex items-center justify-between gap-4 p-6">
					<div className="flex flex-col gap-1">
						<h2 className="text-lg font-semibold text-white">Recent activity</h2>
						<p className="text-xs text-gray-30">Your last five transactions.</p>
					</div>
					<Link
						href="/dashboard/transactions"
						className="flex items-center gap-2 text-xs font-medium text-green-80 hover:text-green-70 transition-colors duration-300"
					>
						View all
						<RiArrowRightLine className="h-4 w-4" />
					</Link>
				</div>

				{transactions.length === 0 ? (
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
									<th className="px-6 py-3 font-medium">Type</th>
									<th className="px-6 py-3 font-medium">Status</th>
									<th className="px-6 py-3 font-medium text-right">Amount</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-70">
								{transactions.map((transaction) => (
									<tr key={transaction.id}>
										<td className="px-6 py-4 text-gray-20 whitespace-nowrap">
											{formatDate(transaction.createdAt)}
										</td>
										<td className="px-6 py-4 text-white">
											{transaction.description || "—"}
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
											{formatCurrency(transaction.amount, primaryCurrency)}
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
