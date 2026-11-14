import { cookies, headers } from "next/headers"
import { auth } from "@/lib/auth"
import { DEMO_COOKIE } from "@/lib/demo-cookie"
import { DEMO_USER } from "@/lib/demo"

export type DashboardViewer =
	| { demo: true; userId: string; name: string; email: string }
	| { demo: false; userId: string; name: string; email: string; sessionId: string }

/** True when the browser holds the demo cookie (read-only sample dashboard). */
export async function isDemoMode(): Promise<boolean> {
	const cookieStore = await cookies()
	return cookieStore.get(DEMO_COOKIE)?.value === "1"
}

/**
 * Resolves who is looking at the dashboard: a demo visitor, a signed-in user,
 * or nobody. Callers redirect to the login page when this returns null.
 */
export async function getDashboardViewer(): Promise<DashboardViewer | null> {
	if (await isDemoMode()) {
		return {
			demo: true,
			userId: DEMO_USER.id,
			name: DEMO_USER.name,
			email: DEMO_USER.email,
		}
	}

	const session = await auth.api.getSession({ headers: await headers() })

	if (!session) return null

	return {
		demo: false,
		userId: session.user.id,
		name: session.user.name,
		email: session.user.email,
		sessionId: session.session.id,
	}
}
