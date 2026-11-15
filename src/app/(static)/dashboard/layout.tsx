import DemoLoadingGate from "@/components/dashboard/DemoLoadingGate"

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className="container mx-auto w-full pt-16 pb-16 flex flex-col gap-6">
			<section className="w-full space-y-8">
				<DemoLoadingGate>{children}</DemoLoadingGate>
			</section>
		</div>
	)
}
