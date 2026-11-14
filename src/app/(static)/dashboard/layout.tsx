import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import DashboardNav from "@/components/dashboard/DashboardNav"

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const session = await auth.api.getSession({
		headers: await headers(),
	})

	if (!session) {
		redirect("/auth/login?redirect=/dashboard")
	}

	return (
		<div className="container mx-auto w-full pt-32 pb-16 flex flex-col lg:flex-row gap-8">
			<DashboardNav />
			<section className="flex-1 min-w-0 space-y-8">{children}</section>
		</div>
	)
}
