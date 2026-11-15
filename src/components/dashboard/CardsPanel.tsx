"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
	RiEyeLine,
	RiEyeOffLine,
	RiLockLine,
	RiWifiLine,
} from "react-icons/ri"
import { formatCurrency } from "@/lib/format"
import type { DebitCard } from "@/lib/cards"

function CardFace({
	card,
	frozen,
	revealed,
}: {
	card: DebitCard
	frozen: boolean
	revealed: boolean
}) {
	return (
		<div
			className={`relative aspect-[1.6/1] w-full overflow-hidden rounded-2xl border-[0.5px] border-gray-60 bg-gradient-to-br from-green-90 via-gray-90 to-gray-80 p-4 transition-all duration-500 md:p-5 xl:p-6 ${
				frozen ? "grayscale" : ""
			}`}
		>
			<div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-green-80/10 blur-3xl" />
			<div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-green-80/10 blur-3xl" />

			<div className="relative flex h-full flex-col justify-between">
				<div className="flex items-start justify-between gap-4">
					<div className="flex flex-col">
						<span className="text-[10px] uppercase tracking-[0.25em] text-gray-20">
							Empower Bonds
						</span>
						<span className="text-[9px] uppercase tracking-[0.2em] text-gray-40">
							{card.network} debit
						</span>
					</div>
					<span className="text-xs font-semibold tracking-[0.2em] text-gray-10">
						{card.network}
					</span>
				</div>

				<div className="flex items-center gap-2 sm:gap-3">
					<div className="relative h-6 w-9 shrink-0 overflow-hidden rounded-[5px] bg-gradient-to-br from-[#e8d8a6] to-[#b9a06a] sm:h-7 sm:w-10">
						<span className="absolute inset-x-1 top-2 h-px bg-[#8a7444]/60" />
						<span className="absolute inset-x-1 top-3.5 h-px bg-[#8a7444]/60" />
						<span className="absolute inset-y-1 left-1/2 w-px bg-[#8a7444]/60" />
					</div>
					<RiWifiLine className="h-4 w-4 rotate-90 text-gray-20" />
				</div>

				<div className="flex flex-col gap-2 sm:gap-3">
					<span
						className="whitespace-nowrap font-mono text-[11px] tracking-[0.12em] text-white sm:text-[13px] md:text-sm xl:text-base"
						style={{ fontVariantNumeric: "tabular-nums" }}
					>
						•••• •••• •••• {revealed ? card.last4 : "••••"}
					</span>
					<div className="flex items-end justify-between gap-2 sm:gap-4">
						<div className="flex min-w-0 flex-col">
							<span className="text-[9px] uppercase tracking-[0.18em] text-gray-40">
								Card holder
							</span>
							<span className="truncate text-[11px] uppercase tracking-[0.08em] text-gray-10">
								{card.holder}
							</span>
						</div>
						<div className="flex shrink-0 flex-col">
							<span className="text-[9px] uppercase tracking-[0.18em] text-gray-40">
								Expires
							</span>
							<span className="text-[11px] text-gray-10">{card.expiry}</span>
						</div>
						<span className="shrink-0 rounded-full border-[0.5px] border-gray-40/60 px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] text-gray-10">
							{card.currency}
						</span>
					</div>
				</div>
			</div>

			{frozen && (
				<div className="absolute inset-0 flex items-center justify-center bg-gray-100/40">
					<span className="flex items-center gap-2 rounded-full border-[0.5px] border-white/25 bg-gray-100/70 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white">
						<RiLockLine className="h-3.5 w-3.5" />
						Frozen
					</span>
				</div>
			)}
		</div>
	)
}

const FREEZE_STORAGE_KEY = "empower:cards:frozen"

export default function CardsPanel({ cards }: { cards: DebitCard[] }) {
	const [frozen, setFrozen] = useState<Record<string, boolean>>({})
	const [revealed, setRevealed] = useState<Record<string, boolean>>({})
	const [hydrated, setHydrated] = useState(false)

	// Freeze state survives reloads by living in local storage.
	useEffect(() => {
		try {
			const stored = window.localStorage.getItem(FREEZE_STORAGE_KEY)
			if (stored) setFrozen(JSON.parse(stored) as Record<string, boolean>)
		} catch {
			// Ignore unreadable storage and start from an unfrozen state.
		}
		setHydrated(true)
	}, [])

	useEffect(() => {
		if (!hydrated) return
		try {
			window.localStorage.setItem(FREEZE_STORAGE_KEY, JSON.stringify(frozen))
		} catch {
			// Storage can be unavailable (private mode); the UI still works.
		}
	}, [frozen, hydrated])

	if (cards.length === 0) {
		return (
			<div className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6 flex flex-col items-start gap-4">
				<p className="text-sm text-gray-20">
					No cards yet. A debit card is issued with every eligible account.
				</p>
				<Link href="/dashboard/accounts" className="text-xs font-medium text-green-80 hover:text-green-70 transition-colors duration-300">
					View accounts
				</Link>
			</div>
		)
	}

	const toggleFreeze = (card: DebitCard) => {
		const next = !frozen[card.id]
		setFrozen((state) => ({ ...state, [card.id]: next }))
		toast.success(next ? "Card frozen" : "Card unfrozen", {
			description: next
				? `Payments on your ${card.accountName} card are paused.`
				: `Your ${card.accountName} card is ready to use.`,
		})
	}

	return (
		<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
			{cards.map((card) => {
				const isFrozen = Boolean(frozen[card.id])
				const isRevealed = Boolean(revealed[card.id])
				const limits = [
					{ label: "Daily ATM", value: formatCurrency(1_000, card.currency) },
					{ label: "Daily spend", value: formatCurrency(5_000, card.currency) },
					{ label: "Contactless", value: "On" },
				]

				return (
					<article
						key={card.id}
						className="flex flex-col gap-4 rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-4 sm:p-5"
					>
						<CardFace card={card} frozen={isFrozen} revealed={isRevealed} />

						<div className="flex items-center justify-between gap-3">
							<div className="flex min-w-0 flex-col">
								<span className="truncate text-sm font-medium text-white">
									{card.accountName}
								</span>
								<span className="text-[10px] uppercase tracking-[0.15em] text-gray-30">
									{card.isPrimary ? "Primary card" : "Linked card"} · {card.network}
								</span>
							</div>
							<button
								type="button"
								onClick={() =>
									setRevealed((state) => ({ ...state, [card.id]: !isRevealed }))
								}
								className="flex shrink-0 items-center gap-1.5 rounded-full border-[0.5px] border-gray-70 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-gray-20 transition-colors duration-300 hover:border-green-80 hover:text-green-80"
							>
								{isRevealed ? (
									<RiEyeOffLine className="h-3.5 w-3.5" />
								) : (
									<RiEyeLine className="h-3.5 w-3.5" />
								)}
								{isRevealed ? "Hide" : "Details"}
							</button>
						</div>

						<div className="flex items-center justify-between gap-4 rounded-lg border-[0.5px] border-gray-70 bg-gray-80/40 px-4 py-3">
							<div className="flex flex-col">
								<span className="text-[10px] uppercase tracking-[0.18em] text-gray-30">
									Card status
								</span>
								<span className={`text-xs font-medium ${isFrozen ? "text-red-400" : "text-green-80"}`}>
									{isFrozen ? "Frozen" : "Active"}
								</span>
							</div>
							<button
								type="button"
								role="switch"
								aria-checked={isFrozen}
								aria-label={`Freeze ${card.accountName} card`}
								onClick={() => toggleFreeze(card)}
								className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors duration-300 ${
									isFrozen ? "bg-green-80" : "bg-gray-60"
								}`}
							>
								<span
									className={`absolute top-0.5 h-5 w-5 rounded-full bg-gray-100 transition-all duration-300 ${
										isFrozen ? "left-[22px]" : "left-0.5"
									}`}
								/>
							</button>
						</div>

						<dl className="grid grid-cols-3 gap-3 border-t border-gray-70 pt-4">
							{limits.map((limit) => (
								<div key={limit.label} className="flex flex-col gap-1">
									<dt className="text-[9px] uppercase tracking-[0.15em] text-gray-30">
										{limit.label}
									</dt>
									<dd className="text-xs font-medium text-white">{limit.value}</dd>
								</div>
							))}
						</dl>
					</article>
				)
			})}
		</div>
	)
}
