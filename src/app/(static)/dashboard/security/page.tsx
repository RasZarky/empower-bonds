// Security posture and signed-in devices.
import Link from "next/link"
import {
	RiComputerLine,
	RiLockPasswordLine,
	RiShieldCheckLine,
	RiSmartphoneLine,
} from "react-icons/ri"
import { DEMO_PREFERENCE, DEMO_SESSIONS, DEMO_USER } from "@/lib/demo"
import { formatDate, formatDateTime } from "@/lib/format"
import type { Session } from "@/types/db"

function deviceIcon(userAgent: string | null | undefined) {
	const agent = (userAgent ?? "").toLowerCase()
	if (agent.includes("iphone") || agent.includes("android") || agent.includes("app")) {
		return <RiSmartphoneLine className="h-4 w-4" />
	}
	return <RiComputerLine className="h-4 w-4" />
}

export default function SecurityPage() {
	const twoFactorEnabled = Boolean(DEMO_USER.twoFactorEnabled)
	const hasTransactionPin = Boolean(DEMO_USER.hashedTransactionPin)
	const emailVerified = Boolean(DEMO_USER.emailVerified)
	const biometric = Boolean(DEMO_PREFERENCE.requireBiometricForSensitiveActions)
	const memberSince: Date | null = DEMO_USER.createdAt
	const sessions: Session[] = DEMO_SESSIONS

	const checks = [
		{
			label: "Transaction PIN",
			status: hasTransactionPin ? "Set" : "Not set",
			ok: hasTransactionPin,
			hint: "Required before any transfer leaves your account.",
			icon: <RiLockPasswordLine className="h-4 w-4" />,
		},
		{
			label: "Two-factor authentication",
			status: twoFactorEnabled ? "Enabled" : "Recommended",
			ok: twoFactorEnabled,
			hint: "A second check when you sign in on a new device.",
			icon: <RiShieldCheckLine className="h-4 w-4" />,
		},
		{
			label: "Biometric approval",
			status: biometric ? "Enabled" : "Off",
			ok: biometric,
			hint: "Approve sensitive actions with Face ID or your fingerprint.",
			icon: <RiSmartphoneLine className="h-4 w-4" />,
		},
		{
			label: "Verified email",
			status: emailVerified ? "Verified" : "Pending",
			ok: emailVerified,
			hint: DEMO_USER.email,
			icon: <RiShieldCheckLine className="h-4 w-4" />,
		},
	]

	const recentSignIns = [...sessions].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
	)

	return (
		<>
			<header className="flex flex-col gap-2">
				<p className="text-[10px] font-medium uppercase tracking-[0.2em] text-green-80">
					Security
				</p>
				<h1 className="text-2xl md:text-3xl font-semibold text-white">Security centre</h1>
				<p className="text-sm text-gray-20">
					Review how your account is protected and where it is signed in.
				</p>
			</header>

			<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{checks.map((check) => (
					<div
						key={check.label}
						className="flex flex-col gap-3 rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6"
					>
						<div className="flex items-center justify-between">
							<span className="text-green-80">{check.icon}</span>
							<span
								className={`rounded-full border-[0.5px] px-2 py-1 text-[9px] uppercase tracking-wider ${
									check.ok
										? "border-green-80/30 bg-green-80/10 text-green-80"
										: "border-gray-60 bg-gray-80 text-gray-20"
								}`}
							>
								{check.status}
							</span>
						</div>
						<span className="text-sm font-medium text-white">{check.label}</span>
						<span className="text-[11px] leading-relaxed text-gray-30">{check.hint}</span>
					</div>
				))}
			</section>

			<section className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90">
				<div className="flex flex-wrap items-center justify-between gap-4 p-6">
					<div className="flex flex-col gap-1">
						<h2 className="text-lg font-semibold text-white">Devices & sessions</h2>
						<p className="text-xs text-gray-30">
							Signed in as {DEMO_USER.email}
							{memberSince ? ` · member since ${formatDate(memberSince)}` : ""}
						</p>
					</div>
					<Link
						href="/dashboard/settings"
						className="text-xs font-medium text-green-80 transition-colors duration-300 hover:text-green-70"
					>
						Manage devices
					</Link>
				</div>

				{sessions.length === 0 ? (
					<p className="border-t border-gray-70 p-6 text-sm text-gray-20">
						No active sessions found.
					</p>
				) : (
					<ul className="divide-y divide-gray-70 border-t border-gray-70">
						{sessions.map((session) => (
							<li
								key={session.id}
								className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
							>
								<div className="flex items-center gap-3">
									<span className="flex h-9 w-9 items-center justify-center rounded-full border-[0.5px] border-gray-70 bg-gray-80 text-green-80">
										{deviceIcon(session.userAgent)}
									</span>
									<div className="flex flex-col">
										<span className="text-sm text-white">
											{session.userAgent || "Unknown device"}
										</span>
										<span className="text-[10px] text-gray-30">
											{session.ipAddress || "Unknown IP"} · signed in{" "}
											{formatDateTime(session.createdAt)}
										</span>
									</div>
								</div>
								<span className="text-[10px] uppercase tracking-[0.15em] text-gray-30">
									Last active {formatDateTime(session.updatedAt)}
								</span>
							</li>
						))}
					</ul>
				)}
			</section>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<section className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6">
					<h2 className="text-lg font-semibold text-white">Recent sign-in activity</h2>
					<p className="pb-4 text-xs text-gray-30">
						The most recent authentications on your account.
					</p>
					<ul className="space-y-4 border-t border-gray-70 pt-4">
						{recentSignIns.slice(0, 4).map((session) => (
							<li key={`activity-${session.id}`} className="flex items-start gap-3">
								<span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-green-80" />
								<div className="flex flex-col">
									<span className="text-xs text-white">
										{session.userAgent || "Unknown device"}
									</span>
									<span className="text-[10px] text-gray-30">
										{formatDateTime(session.createdAt)} · {session.ipAddress || "Unknown IP"}
									</span>
								</div>
							</li>
						))}
						{recentSignIns.length === 0 && (
							<li className="text-xs text-gray-20">No sign-in activity recorded.</li>
						)}
					</ul>
				</section>

				<section className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6">
					<h2 className="text-lg font-semibold text-white">Protect your account</h2>
					<p className="pb-4 text-xs text-gray-30">
						Small habits that stop most account takeovers.
					</p>
					<ul className="space-y-3 border-t border-gray-70 pt-4">
						{[
							"Never share your secret code — our team will never ask for it.",
							"Freeze your card from the Cards page the moment it goes missing.",
							"Use a unique password and let a password manager remember it.",
							"Review devices regularly and sign out anything you do not recognise.",
						].map((tip) => (
							<li key={tip} className="flex items-start gap-3 text-xs text-gray-20">
								<RiShieldCheckLine className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-80" />
								{tip}
							</li>
						))}
					</ul>
				</section>
			</div>
		</>
	)
}
