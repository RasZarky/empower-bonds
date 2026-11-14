import { redirect } from "next/navigation"
import { getDashboardViewer } from "@/lib/dashboard-session"
import { getUserProfileDataAction } from "@/server/action/userAction"
import { getActiveSessionsAction } from "@/server/action/settingsAction"
import { DEMO_PREFERENCE, DEMO_SESSIONS, DEMO_USER } from "@/lib/demo"
import type { Preference, Session } from "@/types/db"
import SettingsForms from "@/components/dashboard/SettingsForms"

export default async function SettingsPage() {
	const viewer = await getDashboardViewer()

	if (!viewer) {
		redirect("/auth/login?redirect=/dashboard/settings")
	}

	let name: string
	let email: string
	let preference: Preference | null
	let sessions: Session[]

	if (viewer.demo) {
		name = DEMO_USER.name
		email = DEMO_USER.email
		preference = DEMO_PREFERENCE
		sessions = DEMO_SESSIONS
	} else {
		const [profileResult, sessionsResult] = await Promise.all([
			getUserProfileDataAction(viewer.userId),
			getActiveSessionsAction(viewer.userId, viewer.sessionId),
		])

		name = profileResult.data?.name || viewer.name || ""
		email = profileResult.data?.email || viewer.email
		preference = profileResult.data?.preferences ?? null
		sessions = sessionsResult.data ?? []
	}

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
				userId={viewer.userId}
				currentSessionId={viewer.demo ? "" : viewer.sessionId}
				name={name}
				email={email}
				preference={preference}
				sessions={sessions}
				demo={viewer.demo}
			/>
		</>
	)
}
