import { DEMO_USER } from "@/lib/demo"

/**
 * The exported build ships only the sample account, so the "viewer" is a
 * constant. Kept as async so pages can still await it while the demo runs.
 */
export type DashboardViewer = {
	demo: true
	userId: string
	name: string
	email: string
}

export const DEMO_VIEWER: DashboardViewer = {
	demo: true,
	userId: DEMO_USER.id,
	name: DEMO_USER.name,
	email: DEMO_USER.email,
}

export async function isDemoMode(): Promise<boolean> {
	return true
}

export async function getDashboardViewer(): Promise<DashboardViewer> {
	return DEMO_VIEWER
}
