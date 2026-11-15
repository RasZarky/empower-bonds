"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
	RiArrowDownSLine,
	RiBankCardLine,
	RiCustomerService2Line,
	RiFileTextLine,
	RiShieldCheckLine,
} from "react-icons/ri"
import { useClickOutside } from "@/hooks/useClickOutside"

export const dashboardMenuLinks = [
	{
		href: "/dashboard/cards",
		label: "Cards",
		description: "Freeze a card and review limits",
		icon: RiBankCardLine,
	},
	{
		href: "/dashboard/statements",
		label: "Statements",
		description: "Download monthly statements",
		icon: RiFileTextLine,
	},
	{
		href: "/dashboard/security",
		label: "Security",
		description: "Devices, PIN and sign-in activity",
		icon: RiShieldCheckLine,
	},
	{
		href: "/dashboard/support",
		label: "Support",
		description: "Talk to a banking specialist",
		icon: RiCustomerService2Line,
	},
] as const

export default function DashboardMoreMenu() {
	const pathname = usePathname()
	const [open, setOpen] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)

	useClickOutside(menuRef, () => setOpen(false))

	const isActive = dashboardMenuLinks.some(
		(link) => pathname === link.href || pathname.startsWith(`${link.href}/`)
	)

	return (
		<div ref={menuRef} className="relative">
			<button
				type="button"
				onClick={() => setOpen((value) => !value)}
				aria-expanded={open}
				className={`flex cursor-pointer items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors duration-300 ${
					isActive ? "text-green-80" : "text-white hover:text-green-80"
				}`}
			>
				More
				<RiArrowDownSLine
					className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
				/>
			</button>

			{open && (
				<motion.div
					initial={{ opacity: 0, y: -8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.18 }}
					className="absolute right-0 top-12 z-[90] w-72 overflow-hidden rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-2 shadow-2xl"
				>
					{dashboardMenuLinks.map((link) => {
						const Icon = link.icon
						const active = pathname === link.href || pathname.startsWith(`${link.href}/`)

						return (
							<Link
								key={link.href}
								href={link.href}
								onClick={() => setOpen(false)}
								className={`flex items-start gap-3 rounded-lg px-3 py-3 transition-colors duration-200 ${
									active ? "bg-gray-80 text-green-80" : "text-white hover:bg-gray-80"
								}`}
							>
								<Icon className="mt-0.5 h-4 w-4 shrink-0" />
								<span className="flex flex-col gap-0.5">
									<span className="text-sm font-medium">{link.label}</span>
									<span className="text-[11px] text-gray-30">{link.description}</span>
								</span>
							</Link>
						)
					})}
				</motion.div>
			)}
		</div>
	)
}
