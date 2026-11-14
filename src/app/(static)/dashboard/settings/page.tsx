import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getUserProfileDataAction } from "@/server/action/userAction"
import { getActiveSessionsAction } from "@/server/action/settingsAction"
import SettingsForms from "@/components/dashboard/SettingsForms"

export default async function SettingsPage() {
	const session = await auth.api.getSession({ headers: await headers() })

	if (!session) {
		redirect("/auth/login?redirect=/dashboard/settings")
	}

	const userId = session.user.id

	const [profileResult, sessionsResult] = await Promise.all([
		getUserProfileDataAction(userId),
		getActiveSessionsAction(userId, session.session.id),
	])

	return (
		<>
			<header className="flex flex-col gap-2">
				<p className="text-[10px] font-medium uppercase tracking-[0.2em] text-green-80">
					Settings
				</p>
				<h1 className="text-2xl md:text-3xl font-semibold text-white">Account settings</h1>
				<p className="text-sm text-gray-20">
					Manage your profile, display preferences and signed-in devices.
				</p>
			</header>

			<SettingsForms
				userId={userId}
				currentSessionId={session.session.id}
				name={profileResult.data?.name || session.user.name || ""}
				email={profileResult.data?.email || session.user.email}
				preference={profileResult.data?.preferences ?? null}
				sessions={sessionsResult.data ?? []}
			/>
		</>
	)
}
