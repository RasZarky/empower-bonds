import { formatCurrency } from "@/lib/format"
import type { CashFlowBucket } from "@/lib/finance"

/**
 * Bar heights are written into the markup, so the chart renders fully without
 * JavaScript. The growth effect is pure CSS (see `.chart-bar` in globals.css),
 * which keeps it independent of hydration.
 */
export default function CashFlowChart({
	buckets,
	currency,
}: {
	buckets: CashFlowBucket[]
	currency: string
}) {
	const max = Math.max(1, ...buckets.flatMap((bucket) => [bucket.income, bucket.expenses]))
	const height = (value: number) => (value > 0 ? Math.max(6, Math.round((value / max) * 140)) : 2)

	// Narrow screens keep the latest six months; the rest appear from md up.
	const hiddenBelowDesktop = Math.max(0, buckets.length - 6)

	return (
		<div className="flex h-44 items-end gap-1.5 sm:gap-3 md:gap-6">
			{buckets.map((bucket, index) => (
				<div
					key={bucket.key}
					className={`flex-1 flex-col items-center gap-3 ${
						index < hiddenBelowDesktop ? "hidden md:flex" : "flex"
					}`}
				>
					<div className="flex h-36 w-full items-end justify-center gap-1 sm:gap-1.5 md:gap-2">
						<div
							className="chart-bar w-full max-w-[18px] flex-1 basis-0 rounded-t bg-green-80 md:max-w-[26px]"
							style={{
								height: `${height(bucket.income)}px`,
								animationDelay: `${index * 45}ms`,
							}}
							title={`In ${formatCurrency(bucket.income, currency)}`}
						/>
						<div
							className="chart-bar w-full max-w-[18px] flex-1 basis-0 rounded-t bg-gray-50 md:max-w-[26px]"
							style={{
								height: `${height(bucket.expenses)}px`,
								animationDelay: `${index * 45 + 40}ms`,
							}}
							title={`Out ${formatCurrency(bucket.expenses, currency)}`}
						/>
					</div>
					<span className="text-[9px] uppercase tracking-[0.12em] text-gray-30 md:text-[10px] md:tracking-[0.15em]">
						{bucket.label}
					</span>
				</div>
			))}
		</div>
	)
}
