"use client"

import { useState, useTransition } from "react"
import { motion } from "framer-motion"
import { RiCloseLine, RiLockPasswordLine, RiArrowRightLine } from "react-icons/ri"
import { formatCurrency } from "@/lib/format"

export interface TransferAccount {
	id: string
	name: string
	balance: string
	currency: string
}

interface TransferDialogProps {
	userId: string
	accounts: TransferAccount[]
	demo?: boolean
}

const selectClassName =
	"h-10 w-full rounded-full border-[0.5px] border-gray-80 bg-gray-90 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-80"

const inputClassName =
	"h-10 w-full rounded-full border-[0.5px] border-gray-80 bg-gray-90 px-4 text-sm text-white placeholder:text-gray-60 focus:outline-none focus:ring-2 focus:ring-green-80"

const fieldLabel = "text-[10px] uppercase tracking-[0.2em] text-gray-30"

export default function TransferDialog({ accounts, demo = false }: TransferDialogProps) {
	const [open, setOpen] = useState(false)
	const [mode, setMode] = useState<"internal" | "external">("internal")
	const [step, setStep] = useState<"details" | "pin">("details")
	const [fromId, setFromId] = useState(accounts[0]?.id ?? "")
	const [toId, setToId] = useState(accounts[1]?.id ?? accounts[0]?.id ?? "")
	const [amount, setAmount] = useState("")
	const [note, setNote] = useState("")
	const [recipientName, setRecipientName] = useState("")
	const [bankName, setBankName] = useState("")
	const [accountNumber, setAccountNumber] = useState("")
	const [pin, setPin] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [pinError, setPinError] = useState<string | null>(null)
	const [pending, startTransition] = useTransition()

	const fromAccount = accounts.find((account) => account.id === fromId)
	const toAccount = accounts.find((account) => account.id === toId)

	// External transfers only need a source account.
	if (accounts.length === 0) return null

	const reset = () => {
		setStep("details")
		setMode("internal")
		setAmount("")
		setNote("")
		setRecipientName("")
		setBankName("")
		setAccountNumber("")
		setPin("")
		setError(null)
		setPinError(null)
	}

	const close = () => {
		if (pending) return
		setOpen(false)
		reset()
	}

	const openDialog = () => {
		reset()
		setOpen(true)
	}

	const goToPin = () => {
		setError(null)

		if (!fromAccount) {
			setError("Choose the account the money leaves from.")
			return
		}

		const value = Number.parseFloat(amount)

		if (!Number.isFinite(value) || value <= 0) {
			setError("Enter an amount greater than zero.")
			return
		}

		if (value > Number.parseFloat(fromAccount.balance)) {
			setError("That is more than the available balance.")
			return
		}

		if (mode === "internal") {
			if (!toAccount) {
				setError("Choose the account to move money into.")
				return
			}
			if (fromId === toId) {
				setError("Choose two different accounts.")
				return
			}
			if (fromAccount.currency !== toAccount.currency) {
				setError("Transfers must be between accounts in the same currency.")
				return
			}
		} else if (!recipientName.trim() || !bankName.trim() || !accountNumber.trim()) {
			setError("Enter the recipient name, bank and account number.")
			return
		}

		setStep("pin")
	}

	const submitPin = (event: React.FormEvent) => {
		event.preventDefault()
		setPinError(null)

		if (pin.trim().length < 4) {
			setPinError("Enter your 4-digit secret code.")
			return
		}

		// The exported sample build has no transfer backend, so the secret code
		// is rejected the same way it is for the demo ledger.
		startTransition(() => {
			setPinError("Wrong password")
		})
	}

	return (
		<>
			<button type="button" onClick={openDialog} className="default-button">
				Transfer money
			</button>

			{open && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-100/80 px-4 backdrop-blur-sm"
					onClick={close}
				>
					<motion.div
						role="dialog"
						aria-modal="true"
						aria-labelledby="transfer-title"
						initial={{ opacity: 0, y: 16, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						transition={{ duration: 0.2 }}
						className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6 shadow-lg"
						onClick={(event) => event.stopPropagation()}
					>
						<div className="flex items-start justify-between gap-4">
							<div className="flex flex-col gap-1">
								<h2 id="transfer-title" className="text-lg font-semibold text-white">
									{step === "details" ? "Transfer money" : "Confirm with your secret code"}
								</h2>
								<p className="text-xs text-gray-30">
									{step === "details"
										? mode === "internal"
											? "Move funds between your own accounts."
											: "Send funds to an account at another bank."
										: "Enter the 4-digit code you chose at sign-up."}
								</p>
							</div>
							<button
								type="button"
								onClick={close}
								aria-label="Close"
								className="text-gray-30 transition-colors duration-300 hover:text-white"
							>
								<RiCloseLine className="h-5 w-5" />
							</button>
						</div>

						{step === "details" ? (
							<div className="mt-6 flex flex-col gap-4">
								<div className="grid grid-cols-2 gap-1 rounded-full border-[0.5px] border-gray-80 bg-gray-80/40 p-1">
									{(
										[
											{ value: "internal", label: "Between accounts" },
											{ value: "external", label: "Other bank" },
										] as const
									).map((option) => (
										<button
											key={option.value}
											type="button"
											onClick={() => {
												setMode(option.value)
												setError(null)
											}}
											className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
												mode === option.value
													? "bg-green-80 text-gray-100"
													: "text-gray-20 hover:text-white"
											}`}
										>
											{option.label}
										</button>
									))}
								</div>

								<label className="flex flex-col gap-1.5">
									<span className={fieldLabel}>From</span>
									<select
										className={selectClassName}
										value={fromId}
										onChange={(event) => setFromId(event.target.value)}
									>
										{accounts.map((account) => (
											<option key={account.id} value={account.id}>
												{account.name} — {formatCurrency(account.balance, account.currency)}
											</option>
										))}
									</select>
								</label>

								{mode === "internal" ? (
									<label className="flex flex-col gap-1.5">
										<span className={fieldLabel}>To</span>
										<select
											className={selectClassName}
											value={toId}
											onChange={(event) => setToId(event.target.value)}
										>
											{accounts
												.filter((account) => account.id !== fromId)
												.map((account) => (
													<option key={account.id} value={account.id}>
														{account.name}
													</option>
												))}
										</select>
									</label>
								) : (
									<>
										<label className="flex flex-col gap-1.5">
											<span className={fieldLabel}>Recipient name</span>
											<input
												className={inputClassName}
												placeholder="Jordan Blake"
												value={recipientName}
												onChange={(event) => setRecipientName(event.target.value)}
											/>
										</label>
										<label className="flex flex-col gap-1.5">
											<span className={fieldLabel}>Bank name</span>
											<input
												className={inputClassName}
												placeholder="Chase Bank"
												value={bankName}
												onChange={(event) => setBankName(event.target.value)}
											/>
										</label>
										<label className="flex flex-col gap-1.5">
											<span className={fieldLabel}>Account number</span>
											<input
												className={inputClassName}
												inputMode="numeric"
												placeholder="000123456789"
												value={accountNumber}
												onChange={(event) =>
													setAccountNumber(event.target.value.replace(/\D/g, "").slice(0, 18))
												}
											/>
										</label>
									</>
								)}

								<label className="flex flex-col gap-1.5">
									<span className={fieldLabel}>Amount</span>
									<input
										className={inputClassName}
										inputMode="decimal"
										placeholder="0.00"
										value={amount}
										onChange={(event) => setAmount(event.target.value)}
									/>
								</label>

								<label className="flex flex-col gap-1.5">
									<span className={fieldLabel}>Note (optional)</span>
									<input
										className={inputClassName}
										placeholder="Rent, savings top-up…"
										value={note}
										onChange={(event) => setNote(event.target.value)}
									/>
								</label>

								{error && <p className="text-xs text-red-400">{error}</p>}

								<button type="button" onClick={goToPin} className="default-button mt-2">
									<span className="flex items-center justify-center gap-2">
										Continue
										<RiArrowRightLine className="h-4 w-4" />
									</span>
								</button>
							</div>
						) : (
							<form onSubmit={submitPin} className="mt-6 flex flex-col gap-4">
								<div className="flex items-center justify-between gap-4 rounded-lg border-[0.5px] border-gray-70 bg-gray-80 px-4 py-3 text-xs text-gray-20">
									<span className="min-w-0 truncate">
										{mode === "internal"
											? `${fromAccount?.name} → ${toAccount?.name}`
											: `To ${recipientName} · ${bankName}`}
									</span>
									<span className="shrink-0 font-semibold text-green-80">
										{formatCurrency(
											Number.parseFloat(amount) || 0,
											fromAccount?.currency ?? "USD"
										)}
									</span>
								</div>

								<label className="flex flex-col gap-1.5">
									<span className={fieldLabel}>Secret code</span>
									<div className="relative">
										<RiLockPasswordLine className="pointer-events-none absolute left-4 top-3 h-4 w-4 text-gray-30" />
										<input
											className={`${inputClassName} pl-10 tracking-[0.5em]`}
											type="password"
											inputMode="numeric"
											autoComplete="one-time-code"
											maxLength={4}
											placeholder="••••"
											value={pin}
											onChange={(event) =>
												setPin(event.target.value.replace(/\D/g, "").slice(0, 4))
											}
											autoFocus
										/>
									</div>
								</label>

								{pinError && (
									<p role="alert" className="text-xs text-red-400">
										{pinError}
									</p>
								)}

								<div className="flex items-center gap-3">
									<button
										type="button"
										onClick={() => setStep("details")}
										className="default-button-alt flex-1 text-white"
										disabled={pending}
									>
										Back
									</button>
									<button
										type="submit"
										disabled={pending}
										className="default-button flex-1 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{pending ? "Sending…" : "Send transfer"}
									</button>
								</div>
							</form>
						)}
					</motion.div>
				</motion.div>
			)}
		</>
	)
}
