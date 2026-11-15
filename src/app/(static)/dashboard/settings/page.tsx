// Profile, preferences and signed-in devices.
import { DEMO_PREFERENCE, DEMO_SESSIONS, DEMO_USER } from "@/lib/demo"
import type { Preference, Session } from "@/types/db"
import SettingsForms from "@/components/dashboard/SettingsForms"

export default function SettingsPage() {
	const name = DEMO_USER.name
	const email = DEMO_USER.email
	const preference: Preference | null = DEMO_PREFERENCE
	const sessions: Session[] = DEMO_SESSIONS

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
				userId={DEMO_USER.id}
				currentSessionId=""
				name={name}
				email={email}
				preference={preference}
				sessions={sessions}
				demo
			/>
		</>
	)
}
