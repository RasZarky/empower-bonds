import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import {
	getBankAccountsWithBalanceAction,
	getUserProfileDataAction,
} from "@/server/action/userAction"
import { formatCurrency, formatDate, maskAccountNumber } from "@/lib/format"
import { CreateAccountForm, SetPrimaryButton } from "@/components/dashboard/AccountControls"

const statusStyles: Record<string, string> = {
	active: "text-green-80 bg-green-80/10 border-green-80/30",
	inactive: "text-gray-20 bg-gray-80 border-gray-60",
	closed: "text-gray-20 bg-gray-80 border-gray-60",
	frozen: "text-red-400 bg-red-400/10 border-red-400/30",
	suspended: "text-red-400 bg-red-400/10 border-red-400/30",
}

export default async function AccountsPage() {
	const session = await auth.api.getSession({ headers: await headers() })

	if (!session) {
		redirect("/auth/login?redirect=/dashboard/accounts")
	}

	const userId = session.user.id

	const [profileResult, accountsResult] = await Promise.all([
		getUserProfileDataAction(userId),
		getBankAccountsWithBalanceAction(userId),
	])

	const accounts = accountsResult.data ?? []
	const hideBalances = profileResult.data?.preferences?.hideBalances ?? false

	return (
		<>
			<header className="flex flex-col gap-2">
				<p className="text-[10px] font-medium uppercase tracking-[0.2em] text-green-80">
					Accounts
				</p>
				<h1 className="text-2xl md:text-3xl font-semibold text-white">Account management</h1>
				<p className="text-sm text-gray-20">
					Review your accounts, update your primary account, or open a new one.
				</p>
			</header>

			<section className="space-y-4">
				{accounts.length === 0 ? (
					<div className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6">
						<p className="text-sm text-gray-20">
							No accounts on file yet. Open your first account below.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{accounts.map((account) => {
							const isFrozen = account.status === "frozen" || account.status === "suspended"

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
											<SetPrimaryButton userId={userId} accountId={account.id} />
										)}
									</div>
								</article>
							)
						})}
					</div>
				)}
			</section>

			<section className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6">
				<div className="flex flex-col gap-1 pb-6">
					<h2 className="text-lg font-semibold text-white">Open a new account</h2>
					<p className="text-xs text-gray-30">
						A unique account number is generated for you automatically.
					</p>
				</div>
				<CreateAccountForm userId={userId} />
			</section>
		</>
	)
}
