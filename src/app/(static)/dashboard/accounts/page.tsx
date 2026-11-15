// Lists every bank account with its balance, status and account details.
import { DEMO_ACCOUNTS, DEMO_PREFERENCE } from "@/lib/demo"
import type { BankAccount } from "@/types/db"
import { formatCurrency, formatDate, maskAccountNumber } from "@/lib/format"
import { SetPrimaryButton } from "@/components/dashboard/AccountControls"
import CopyButton from "@/components/dashboard/CopyButton"

const statusStyles: Record<string, string> = {
	active: "text-green-80 bg-green-80/10 border-green-80/30",
	inactive: "text-gray-20 bg-gray-80 border-gray-60",
	closed: "text-gray-20 bg-gray-80 border-gray-60",
	frozen: "text-red-400 bg-red-400/10 border-red-400/30",
	suspended: "text-red-400 bg-red-400/10 border-red-400/30",
}

export default function AccountsPage() {
	const accounts: BankAccount[] = DEMO_ACCOUNTS
	const hideBalances = DEMO_PREFERENCE.hideBalances

	const totalsByCurrency = accounts.reduce<Record<string, number>>((totals, account) => {
		const amount = Number.parseFloat(account.balance)
		totals[account.currency] =
			(totals[account.currency] ?? 0) + (Number.isFinite(amount) ? amount : 0)
		return totals
	}, {})

	return (
		<>
			<header className="flex flex-col gap-2">
				<p className="text-[10px] font-medium uppercase tracking-[0.2em] text-green-80">
					Accounts
				</p>
				<h1 className="text-2xl md:text-3xl font-semibold text-white">Account management</h1>
				<p className="text-sm text-gray-20">
					Review your accounts and choose which one is your primary account.
				</p>
			</header>

			<section className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6 flex flex-wrap gap-8">
				{Object.entries(totalsByCurrency).map(([currency, total]) => (
					<div key={currency} className="flex flex-col gap-1">
						<span className="text-[10px] uppercase tracking-[0.2em] text-gray-30">
							Total · {currency}
						</span>
						<span className="text-xl font-semibold text-green-80">
							{hideBalances ? "••••••" : formatCurrency(total, currency)}
						</span>
					</div>
				))}
				<div className="flex flex-col gap-1">
					<span className="text-[10px] uppercase tracking-[0.2em] text-gray-30">
						Accounts
					</span>
					<span className="text-xl font-semibold text-white">{accounts.length}</span>
				</div>
			</section>

			<section className="space-y-4">
				{accounts.length === 0 ? (
					<div className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6">
						<p className="text-sm text-gray-20">
							No accounts on file yet. Contact support to finish setting up your account.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{accounts.map((account) => {
							const isFrozen = account.status === "frozen" || account.status === "suspended"
							const currencyTotal = totalsByCurrency[account.currency] ?? 0
							const balance = Number.parseFloat(account.balance)
							const share =
								currencyTotal > 0 && Number.isFinite(balance)
									? Math.round((balance / currencyTotal) * 100)
									: 0

							return (
								<article
									key={account.id}
									className="rounded-xl border-[0.5px] border-gray-70 bg-gradient-to-br from-gray-90 to-green-90 p-6 flex flex-col gap-6"
								>
									<div className="flex items-start justify-between gap-4">
										<div className="flex flex-col gap-1 min-w-0">
											<span className="text-sm font-semibold text-white truncate">
												{account.accountName ?? "Account"}
											</span>
											<span className="text-xs text-gray-30 capitalize">
												{account.accountType.replace(/_/g, " ")}
												{account.bankName ? ` · ${account.bankName}` : ""}
											</span>
										</div>
										<span
											className={`rounded-full border-[0.5px] px-2 py-1 text-[10px] uppercase tracking-wider ${
												statusStyles[account.status] ?? statusStyles.inactive
											}`}
										>
											{account.status}
										</span>
									</div>

									<div className="flex flex-col gap-1">
										<span className="text-[10px] uppercase tracking-[0.2em] text-gray-30">
											Available balance
										</span>
										<span
											className={`text-2xl font-semibold ${
												isFrozen ? "text-gray-30" : "text-green-80"
											}`}
										>
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
										<span className="w-16 shrink-0 text-right text-[10px] text-gray-30">
											{share}% of {account.currency}
										</span>
									</div>

									<div className="flex items-center justify-between gap-4 border-t border-gray-70 pt-4">
										<div className="flex flex-col gap-0.5">
											<span className="text-xs text-white">
												{maskAccountNumber(account.accountNumber)}
											</span>
											<span className="text-[10px] text-gray-30">
												Opened {formatDate(account.createdAt)}
											</span>
										</div>
										{account.isPrimary ? (
											<span className="text-[10px] uppercase tracking-wider text-green-80">
												Primary
											</span>
										) : (
											<SetPrimaryButton accountId={account.id} demo />
										)}
									</div>

									<details className="border-t border-gray-70 pt-4">
										<summary className="cursor-pointer list-none text-[10px] uppercase tracking-[0.15em] text-gray-30 transition-colors duration-300 hover:text-green-80">
											Account details
										</summary>
										<dl className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
											<div className="flex flex-col gap-0.5">
												<dt className="text-[9px] uppercase tracking-[0.15em] text-gray-30">
													Account number
												</dt>
												<dd className="flex items-center gap-2 text-white">
													{account.accountNumber ?? "—"}
													{account.accountNumber && (
														<CopyButton value={account.accountNumber} />
													)}
												</dd>
											</div>
											<div className="flex flex-col gap-0.5">
												<dt className="text-[9px] uppercase tracking-[0.15em] text-gray-30">
													Bank
												</dt>
												<dd className="text-white">{account.bankName ?? "Empower Bonds"}</dd>
											</div>
											<div className="flex flex-col gap-0.5">
												<dt className="text-[9px] uppercase tracking-[0.15em] text-gray-30">
													Branch
												</dt>
												<dd className="text-white">{account.branchName ?? "—"}</dd>
											</div>
											<div className="flex flex-col gap-0.5">
												<dt className="text-[9px] uppercase tracking-[0.15em] text-gray-30">
													Currency
												</dt>
												<dd className="text-white">{account.currency}</dd>
											</div>
										</dl>
									</details>
								</article>
							)
						})}
					</div>
				)}
			</section>

		</>
	)
}
