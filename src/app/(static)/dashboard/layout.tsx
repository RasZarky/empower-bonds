import { redirect } from "next/navigation"
import { getDashboardViewer } from "@/lib/dashboard-session"
import { endDemoSession } from "@/server/action/demoAction"
import DashboardNav from "@/components/dashboard/DashboardNav"

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const viewer = await getDashboardViewer()

	if (!viewer) {
		redirect("/auth/login?redirect=/dashboard")
	}

	return (
		<div className="container mx-auto w-full pt-32 pb-16 flex flex-col gap-6">
			{viewer.demo && (
				<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-[0.5px] border-green-80/30 bg-green-80/5 px-6 py-4">
					<p className="text-xs text-gray-20">
						<span className="font-semibold text-green-80">Demo mode.</span> You are
						viewing sample data — nothing is saved and every action is disabled.
					</p>
					<form action={endDemoSession}>
						<button
							type="submit"
							className="text-xs font-medium text-green-80 hover:text-green-70 transition-colors duration-300 cursor-pointer"
						>
							Exit demo
						</button>
					</form>
				</div>
			)}

			<div className="flex flex-col lg:flex-row gap-8">
				<DashboardNav />
				<section className="flex-1 min-w-0 space-y-8">{children}</section>
			</div>
		</div>
	)
}
