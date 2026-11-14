// src/app/api/actions/settings.ts
"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { DB } from "@/db";
import schemas from "@/db/schemas";
import { createActionResult } from "@/db/helpers/withPagination"; // Assuming this helper exists
import {
    ActionResult,
    NotificationSetting,
    UpdateNotificationSetting,
    SocialSecurity,
    Passkey,
    Session,
    SettingsPageData,
    NewSocialSecurity,
} from "@/types/db";
import { and, eq, desc, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// --- Notifications Actions ---

/**
 * Fetches all notification settings for a specific user.
 * @param userId The ID of the user.
 * @returns An ActionResult containing an array of NotificationSetting.
 */
export async function getNotificationSettingsAction(
    userId: string
): Promise<ActionResult<NotificationSetting[] | undefined>> {
    try {
        const settings = await DB.query.notificationSettings.findMany({
            where: eq(schemas.notificationSettings.userId, userId),
            orderBy: [schemas.notificationSettings.notificationType, schemas.notificationSettings.channel],
        });
        return createActionResult(true, settings, undefined, "Notification settings fetched successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || "Failed to fetch notification settings.");
    }
}

/**
 * Updates a specific notification setting for a user.
 * @param userId The ID of the user.
 * @param settingId The ID of the notification setting to update.
 * @param values The fields to update.
 * @returns An ActionResult containing the updated NotificationSetting.
 */
export async function updateNotificationSettingAction(
    userId: string,
    settingId: string,
    values: UpdateNotificationSetting
): Promise<ActionResult<NotificationSetting | undefined>> {
    try {
        const [updatedSetting] = await DB.update(schemas.notificationSettings)
            .set({ ...values, updatedAt: new Date() })
            .where(and(
                eq(schemas.notificationSettings.id, settingId),
                eq(schemas.notificationSettings.userId, userId)
            ))
            .returning();

        if (!updatedSetting) {
            return createActionResult<undefined>(false, undefined, "NotFound", "Notification setting not found or unauthorized.");
        }

        revalidatePath("/dashboard/settings"); // Revalidate settings page
        return createActionResult(true, updatedSetting, undefined, "Notification setting updated successfully.");
    } catch (error: any) {

        return createActionResult<undefined>(false, undefined, "ServerError", error.message || "Failed to update notification setting.");
    }
}

// --- Social Security Actions ---

/**
 * Fetches the social security details for a specific user.
 * @param userId The ID of the user.
 * @returns An ActionResult containing SocialSecurity data or null if not found.
 */
export async function getSocialSecurityAction(
    userId: string
): Promise<ActionResult<SocialSecurity | undefined>> {
    try {
        const socialSecurityData = await DB.query.socialSecurity.findFirst({
            where: eq(schemas.socialSecurity.userId, userId),
        });
        return createActionResult(true, socialSecurityData, undefined, "Social security data fetched successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || "Failed to fetch social security data.");
    }
}

/**
 * Creates or updates social security details for a user.
 * @param userId The ID of the user.
 * @param values The social security data to upsert.
 * @returns An ActionResult containing the upserted SocialSecurity data.
 */
export async function upsertSocialSecurityAction(
    userId: string,
    values: NewSocialSecurity
): Promise<ActionResult<SocialSecurity | undefined>> {
    try {
        const existingSocialSecurity = await DB.query.socialSecurity.findFirst({
            where: eq(schemas.socialSecurity.userId, userId),
        });

        let result;
        if (existingSocialSecurity) {
            [result] = await DB.update(schemas.socialSecurity)
                .set({ ...values, updatedAt: new Date() })
                .where(eq(schemas.socialSecurity.userId, userId))
                .returning();
        } else {
            [result] = await DB.insert(schemas.socialSecurity)
                .values({ ...values, userId, createdAt: new Date(), updatedAt: new Date() })
                .returning();
        }


        if (!result) {
            return createActionResult<undefined>(false, undefined, "UpsertFailed", "Failed to save social security data.");
        }

        revalidatePath("/dashboard/settings");
        return createActionResult(true, result, undefined, "Social security data saved successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || "Failed to save social security data.");
    }
}

// --- Passkey Actions ---

/**
 * Fetches all passkeys registered for a user.
 * @param userId The ID of the user.
 * @returns An ActionResult containing an array of Passkey.
 */
export async function getPasskeysAction(
    userId: string
): Promise<ActionResult<Passkey[] | undefined>> {
    try {
        const passkeys = await DB.query.passkey.findMany({
            where: eq(schemas.passkey.userId, userId),
            orderBy: [desc(schemas.passkey.createdAt)],
        });
        return createActionResult(true, passkeys, undefined, "Passkeys fetched successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || "Failed to fetch passkeys.");
    }
}

/**
 * Update passkey name for a user.
 * @param id The ID for the passkey.
 * @param name The name to update into for the passkey.
 * @returns An ActionResult containing a Passkey.
 */
export async function updatePasskeysAction(
    id: string,
    name: string
): Promise<ActionResult<Passkey | undefined>> {
    try {
        const data = await auth.api.updatePasskey({
            body: {
                id, // required
                name, // required
            },
            // This endpoint requires session cookies.
            headers: await headers(),
        });
        const pkey = {
            ...data.passkey,
            name: data.passkey.name || null,
            createdAt: data.passkey.createdAt || null,
            transports: data.passkey.transports || null,
            aaguid: data.passkey.aaguid || null
        }
        revalidatePath("/dashboard/settings");
        return createActionResult(true, pkey, undefined, "Passkeys fetched successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || "Failed to fetch passkeys.");
    }
}



// --- Active Sessions Actions ---

/**
 * Fetches all active sessions for a user, excluding the current one.
 * @param userId The ID of the user.
 * @param currentSessionId The ID of the current active session (to exclude it from the list).
 * @returns An ActionResult containing an array of Session.
 */
export async function getActiveSessionsAction(
    userId: string,
    currentSessionId: string
): Promise<ActionResult<Session[] | undefined>> {
    try {
        const sessions = await DB.query.session.findMany({
            where: and(
                eq(schemas.session.userId, userId),
                ne(schemas.session.id, currentSessionId), // Exclude current session
                sql`${schemas.session.expiresAt} > NOW()` // Only truly active sessions
            ),
            orderBy: [desc(schemas.session.createdAt)],
        });
        return createActionResult(true, sessions, undefined, "Active sessions fetched successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || "Failed to fetch active sessions.");
    }
}

/**
 * Terminates a specific user session.
 * @param userId The ID of the user.
 * @param sessionIdToTerminate The ID of the session to terminate.
 * @returns An ActionResult confirming termination.
 */
export async function terminateSessionAction(
    userId: string,
    sessionIdToTerminate: string
): Promise<ActionResult<{ id: string } | undefined>> {
    try {
        const [terminatedSession] = await DB.delete(schemas.session)
            .where(and(
                eq(schemas.session.id, sessionIdToTerminate),
                eq(schemas.session.userId, userId)
            ))
            .returning({ id: schemas.session.id });

        if (!terminatedSession) {
            return createActionResult<undefined>(false, undefined, "NotFound", "Session not found or unauthorized.");
        }

        revalidatePath("/dashboard/settings");
        return createActionResult(true, terminatedSession, undefined, "Session terminated successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || "Failed to terminate session.");
    }
}

/**
 * Terminates all other active sessions for a user, except the current one.
 * @param userId The ID of the user.
 * @param currentSessionId The ID of the current active session.
 * @returns An ActionResult with the count of terminated sessions.
 */
export async function terminateAllOtherSessionsAction(
    userId: string,
    currentSessionId: string
): Promise<ActionResult<{ count: number } | undefined>> {
    try {
        // Drizzle's delete.where().execute() returns a Promise<void> for count,
        // or you can use .returning() to get specific columns.
        // For a count, you might need a separate query or rely on a `returning` clause
        // that returns the deleted IDs and then count them.
        const deletedSessions = await DB.delete(schemas.session)
            .where(and(
                eq(schemas.session.userId, userId),
                ne(schemas.session.id, currentSessionId)
            ))
            .returning({ id: schemas.session.id }); // Return IDs to count them

        revalidatePath("/dashboard/settings");
        return createActionResult(true, { count: deletedSessions.length }, undefined, `${deletedSessions.length} other sessions terminated.`);
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || "Failed to terminate all other sessions.");
    }
}

// --- Combined Fetch for Settings Page ---
/**
 * Fetches all initial data required for the settings page tabs.
 * @param userId The ID of the user.
 * @param currentSessionId The ID of the current session.
 * @returns An ActionResult containing all settings page data.
 */
export async function getSettingsPageDataAction(
    userId: string,
    currentSessionId: string
): Promise<ActionResult<SettingsPageData | undefined>> {
    try {
        const [notificationSettingsResult, socialSecurityResult, passkeysResult, activeSessionsResult] = await Promise.all([
            getNotificationSettingsAction(userId),
            getSocialSecurityAction(userId),
            getPasskeysAction(userId),
            getActiveSessionsAction(userId, currentSessionId),
        ]);

        if (!notificationSettingsResult.success || !socialSecurityResult.success || !passkeysResult.success || !activeSessionsResult.success) {
            // Aggregate errors or return the first one
            const errorMessage = notificationSettingsResult.message || socialSecurityResult.message || passkeysResult.message || activeSessionsResult.message || "Failed to load all settings data.";
            return createActionResult<undefined>(false, undefined, "PartialLoadError", errorMessage);
        }

        const data: SettingsPageData = {
            notificationSettings: notificationSettingsResult.data || [],
            socialSecurity: socialSecurityResult.data || null,
            passkeys: passkeysResult.data || [],
            activeSessions: activeSessionsResult.data || [],
        };

        return createActionResult(true, data, undefined, "Settings page data loaded successfully.");
    } catch (error: any) {
        return createActionResult<undefined>(false, undefined, "ServerError", error.message || "Failed to load settings page data.");
    }
}