export default function DashboardLoading() {
	return (
		<div
			className="flex flex-col gap-6 pb-10"
			aria-busy="true"
			aria-live="polite"
		>
			<span className="sr-only">Loading dashboard…</span>

			<div className="flex flex-col gap-3">
				<div className="h-2.5 w-24 animate-pulse rounded-full bg-gray-80" />
				<div className="h-8 w-64 max-w-full animate-pulse rounded-full bg-gray-80" />
				<div className="h-3 w-80 max-w-full animate-pulse rounded-full bg-gray-80" />
			</div>

			<div className="h-56 animate-pulse rounded-xl border-[0.5px] border-gray-70 bg-gray-90" />

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{Array.from({ length: 4 }).map((_, index) => (
					<div
						key={index}
						className="h-32 animate-pulse rounded-xl border-[0.5px] border-gray-70 bg-gray-90"
					/>
				))}
			</div>

			<div className="h-72 animate-pulse rounded-xl border-[0.5px] border-gray-70 bg-gray-90" />
		</div>
	)
}
