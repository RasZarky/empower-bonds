"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { DEMO_COOKIE } from "@/lib/demo-cookie"

/** Enters the read-only demo dashboard without touching auth or the database. */
export async function startDemoSession(): Promise<void> {
	const cookieStore = await cookies()

	cookieStore.set(DEMO_COOKIE, "1", {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 8,
	})

	redirect("/dashboard")
}

/** Leaves the demo and returns to the marketing site. */
export async function endDemoSession(): Promise<void> {
	const cookieStore = await cookies()

	cookieStore.delete(DEMO_COOKIE)

	redirect("/")
}
