"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

// The static demo has nothing to fetch, so a short delay is simulated to show
// the loading state the real dashboard would have.
const DEMO_LOAD_MS = 900

function Skeleton() {
	return (
		<div className="w-full space-y-8" aria-busy="true">
			<div className="flex flex-col gap-3">
				<div className="h-2.5 w-24 animate-pulse rounded-full bg-gray-80" />
				<div className="h-8 w-64 max-w-full animate-pulse rounded-lg bg-gray-80" />
				<div className="h-4 w-80 max-w-full animate-pulse rounded bg-gray-80" />
				<span className="sr-only">Loading your demo data…</span>
			</div>

			<div className="h-56 animate-pulse rounded-xl border-[0.5px] border-gray-70 bg-gray-90" />

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{[0, 1, 2, 3].map((card) => (
					<div
						key={card}
						className="h-28 animate-pulse rounded-xl border-[0.5px] border-gray-70 bg-gray-90"
					/>
				))}
			</div>

			<div className="h-72 animate-pulse rounded-xl border-[0.5px] border-gray-70 bg-gray-90" />
		</div>
	)
}

function Gate({ children }: { children: React.ReactNode }) {
	const [ready, setReady] = useState(false)

	useEffect(() => {
		const timer = setTimeout(() => setReady(true), DEMO_LOAD_MS)
		return () => clearTimeout(timer)
	}, [])

	return ready ? <>{children}</> : <Skeleton />
}

export default function DemoLoadingGate({ children }: { children: React.ReactNode }) {
	// Keying on the pathname shows the skeleton again for each dashboard page.
	const pathname = usePathname()

	return <Gate key={pathname}>{children}</Gate>
}
