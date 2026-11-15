"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { RiBellLine, RiCheckLine } from "react-icons/ri"
import { useClickOutside } from "@/hooks/useClickOutside"
import { formatRelative } from "@/lib/format"
import type { AppNotification } from "@/lib/notifications"

const toneStyles: Record<AppNotification["tone"], string> = {
	success: "bg-green-80",
	info: "bg-gray-30",
	warning: "bg-yellow-400",
}

const READ_STORAGE_KEY = "empower:notifications:read"

export default function NotificationsBell({ items }: { items: AppNotification[] }) {
	const [open, setOpen] = useState(false)
	const [readIds, setReadIds] = useState<string[]>([])
	const panelRef = useRef<HTMLDivElement>(null)

	useClickOutside(panelRef, () => setOpen(false))

	// Read state is kept in local storage so it survives navigation and reloads.
	useEffect(() => {
		try {
			const stored = window.localStorage.getItem(READ_STORAGE_KEY)
			if (stored) setReadIds(JSON.parse(stored) as string[])
		} catch {
			// Ignore unreadable storage.
		}
	}, [])

	const persist = (ids: string[]) => {
		setReadIds(ids)
		try {
			window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(ids))
		} catch {
			// Storage can be unavailable (private mode); the UI still works.
		}
	}

	const markAllRead = () => {
		persist(Array.from(new Set([...readIds, ...items.map((item) => item.id)])))
	}

	const markRead = (id: string) => {
		if (readIds.includes(id)) return
		persist([...readIds, id])
	}

	const unread = items.filter((item) => !readIds.includes(item.id)).length

	return (
		<div ref={panelRef} className="relative">
			<button
				type="button"
				onClick={() => setOpen((value) => !value)}
				aria-label="Notifications"
				aria-expanded={open}
				className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-[0.5px] border-gray-60 text-white transition-colors duration-300 hover:border-green-80 hover:text-green-80"
			>
				<RiBellLine className="h-4 w-4" />
				{unread > 0 && (
					<span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-green-80 ring-2 ring-gray-70" />
				)}
			</button>

			{open && (
				<motion.div
					initial={{ opacity: 0, y: -8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.18 }}
					className="absolute right-0 top-12 z-[90] w-80 overflow-hidden rounded-xl border-[0.5px] border-gray-70 bg-gray-90 shadow-2xl"
				>
					<div className="flex items-center justify-between gap-3 border-b border-gray-70 px-5 py-4">
						<div className="flex flex-col">
							<span className="text-sm font-semibold text-white">Notifications</span>
							<span className="text-[10px] uppercase tracking-[0.2em] text-gray-30">
								{unread > 0 ? `${unread} unread` : "All caught up"}
							</span>
						</div>
						{unread > 0 && (
							<button
								type="button"
								onClick={markAllRead}
								className="flex items-center gap-1 text-[11px] font-medium text-green-80 transition-colors duration-300 hover:text-green-70"
							>
								<RiCheckLine className="h-3.5 w-3.5" />
								Mark read
							</button>
						)}
					</div>

					{items.length === 0 ? (
						<p className="px-5 py-6 text-xs text-gray-20">Nothing new right now.</p>
					) : (
						<ul className="max-h-80 divide-y divide-gray-70 overflow-y-auto">
							{items.map((item) => (
								<li
									key={item.id}
									onClick={() => markRead(item.id)}
									className="flex cursor-pointer gap-3 px-5 py-4 transition-colors duration-200 hover:bg-gray-80/40"
								>
									<span
										className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
											readIds.includes(item.id) ? "bg-gray-50" : toneStyles[item.tone]
										}`}
									/>
									<div className="flex min-w-0 flex-col gap-0.5">
										<div className="flex items-baseline justify-between gap-3">
											<span
												className={`truncate text-xs font-semibold ${
													readIds.includes(item.id) ? "text-gray-20" : "text-white"
												}`}
											>
												{item.title}
											</span>
											<span className="shrink-0 text-[10px] text-gray-30">
												{formatRelative(item.time)}
											</span>
										</div>
										<span className="text-[11px] leading-relaxed text-gray-30">
											{item.body}
										</span>
									</div>
								</li>
							))}
						</ul>
					)}
				</motion.div>
			)}
		</div>
	)
}
