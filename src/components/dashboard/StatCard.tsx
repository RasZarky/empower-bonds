import type { ReactNode } from "react"

interface StatCardProps {
	label: string
	value: ReactNode
	hint?: ReactNode
	icon?: ReactNode
}

export default function StatCard({ label, value, hint, icon }: StatCardProps) {
	return (
		<div className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6 flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<span className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-20">
					{label}
				</span>
				{icon && <span className="text-green-80">{icon}</span>}
			</div>
			<span className="text-2xl font-semibold text-white break-words">{value}</span>
			{hint && <span className="text-xs text-gray-30">{hint}</span>}
		</div>
	)
}
