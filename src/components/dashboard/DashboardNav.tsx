"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
	RiBankCardLine,
	RiDashboardHorizontalLine,
	RiExchangeDollarLine,
	RiSettings3Line,
} from "react-icons/ri"

const links = [
	{ href: "/dashboard", label: "Overview", icon: RiDashboardHorizontalLine },
	{ href: "/dashboard/accounts", label: "Accounts", icon: RiBankCardLine },
	{ href: "/dashboard/transactions", label: "Transactions", icon: RiExchangeDollarLine },
	{ href: "/dashboard/settings", label: "Settings", icon: RiSettings3Line },
]

export default function DashboardNav() {
	const pathname = usePathname()

	return (
		<nav className="lg:w-60 shrink-0">
			<div className="lg:sticky lg:top-32 flex lg:flex-col gap-1 overflow-x-auto scrollbar-hide rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-2">
				{links.map((link) => {
					const isActive =
						link.href === "/dashboard"
							? pathname === link.href
							: pathname.startsWith(link.href)
					const Icon = link.icon

					return (
						<Link
							key={link.href}
							href={link.href}
							className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-4 py-3 text-sm font-medium transition-colors duration-300 ${
								isActive
									? "bg-green-80 text-gray-100"
									: "text-gray-20 hover:bg-gray-80 hover:text-white"
							}`}
						>
							<Icon className="h-4 w-4" />
							{link.label}
						</Link>
					)
				})}
			</div>
		</nav>
	)
}
