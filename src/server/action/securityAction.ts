"use server"

/* eslint-disable @typescript-eslint/no-explicit-any */
import { eq } from "drizzle-orm"
import { DB } from "@/db"
import schemas from "@/db/schemas"
import { createActionResult } from "@/db/helpers/withPagination"
import type { ActionResult } from "@/types/db"

export interface SecurityOverview {
	twoFactorEnabled: boolean
	hasTransactionPin: boolean
	emailVerified: boolean
	accountAge: Date | null
	lastUpdated: Date | null
}

/** Read-only snapshot of the account's security posture for the security page. */
export async function getSecurityOverviewAction(
	userId: string
): Promise<ActionResult<SecurityOverview>> {
	try {
		const user = await DB.query.user.findFirst({
			where: eq(schemas.user.id, userId),
		})

		if (!user) {
			return createActionResult<SecurityOverview>(false, undefined, "NotFound", "User not found.")
		}

		return createActionResult<SecurityOverview>(
			true,
			{
				twoFactorEnabled: Boolean(user.twoFactorEnabled),
				hasTransactionPin: Boolean(user.hashedTransactionPin),
				emailVerified: Boolean(user.emailVerified),
				accountAge: user.createdAt ?? null,
				lastUpdated: user.updatedAt ?? null,
			},
			undefined,
			"Security overview loaded."
		)
	} catch (error: any) {
		const err = new Error(error.message || "Failed to load security overview")
		return createActionResult<SecurityOverview>(
			false,
			undefined,
			err.name || "ServerError",
			err.message
		)
	}
}
