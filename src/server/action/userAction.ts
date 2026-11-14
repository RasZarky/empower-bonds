"use server"

/* eslint-disable @typescript-eslint/no-explicit-any */
import { DB } from "@/db";
import { createActionResult, withPagination } from "@/db/helpers/withPagination";
import schemas from "@/db/schemas";
import {
    ActionResult,
    Preference,
    User,
    NewNotificationSetting,
    UpdateBankAccount,
    BankAccount,
    NewBankAccount,
    UpdatePreference,
    UpdateUser,
    PaginatedResult,
    UserProfileData,
} from "@/types/db";
import { and, desc, eq, isNotNull, isNull, like, lt, not, or, sql } from "drizzle-orm";
import { DEFAULT_NOTIFICATION_SETTINGS, generateBankAccountNumber } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";

/**
 * Creates a new preference entry for a given user and initializes their default notification settings.
 * This should typically be called once per user upon their initial setup.
 *
 * @param {string} userId - The ID of the user for whom to create preferences and default notifications.
 * @returns {Promise<ActionResult<{ user: User, preference: Preference } | undefined>>}
 * A promise that resolves to an ActionResult containing the user and their new preference, or an error.
 */
export async function createPreferenceAction(
    userId: string
): Promise<ActionResult<{ user: User, preference: Preference } | undefined>> {
    try {
        const user = await DB.query.user.findFirst({
            where: eq(schemas.user.id, userId),
        });

        if (!user) {
            return createActionResult<undefined>(false, undefined, "UserNotFound", "User does not exist. Try creating an account.");
        }

        const result = await DB.transaction(async (tx) => {
            const existingPreference = await tx.query.preferences.findFirst({
                where: eq(schemas.preferences.userId, userId),
            });

            if (existingPreference) {
                return {
                    user: user,
                    preference: existingPreference,
                    message: "User preference already exists.",
                    isNew: false
                };
            }

            const [preference] = await tx.insert(schemas.preferences)
                .values({ userId })
                .returning();

            if (!preference) {
                tx.rollback();
                throw new Error("Failed to create user preference record.");
            }

            const defaultNotificationRecords: NewNotificationSetting[] = DEFAULT_NOTIFICATION_SETTINGS.map(config => ({
                userId: userId,
                notificationType: config.type,
                channel: config.channel,
                enabled: config.enabled,
            }));

            const createdNotificationSettings = await tx.insert(schemas.notificationSettings)
                .values(defaultNotificationRecords)
                .returning();

            if (createdNotificationSettings.length !== defaultNotificationRecords.length) {
                tx.rollback();
                throw new Error("Failed to initialize all default notification settings.");
            }

            return {
                user: user,
                preference: preference,
                message: "Preference and default notification settings created successfully.",
                isNew: true
            };
        });

        if (result.isNew === false) {
            return createActionResult<{ user: User, preference: Preference }>(
                true,
                { user: result.user, preference: result.preference },
                undefined,
                result.message
            );
        }

        // Revalidate paths affected by creating preferences and notification settings
        revalidatePath(`/dashboard/settings/preferences`);
        revalidatePath(`/dashboard/profile`); // Preferences might be shown on the user's profile
        return createActionResult<{ user: User, preference: Preference }>(
            true,
            { user: result.user, preference: result.preference },
            undefined,
            result.message
        );

    } catch (error: any) {
        const err = new Error(error.message || 'Failed to create PREFERENCES and default notifications for user');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}


export async function getUsersSelectActions(): Promise<ActionResult<User[] | undefined>> {
    try {
        const users = await DB.query.user.findMany({
            where: eq(schemas.user.blocked, false)
        })

        return createActionResult<User[]>(
            true,
            users,
            undefined,
            "Users retrieved successfully."
        );
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to retrieve users');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Fetches a paginated list of all users, with optional filters for status and roles.
 *
 * @param {object} [filters] - Optional filters for users.
 * @param {boolean} [filters.blocked] - Filter for blocked users (true for blocked, false for unblocked).
 * @param {boolean} [filters.emailVerified] - Filter for email verification status (true for verified, false for unverified).
 * @param {boolean} [filters.admin] - Filter for admin users (true for admin, false for non-admin).
 * @param {string} [filters.search] - Search users by email, first name, or last name.
 * @param {string} [cursor] - The `createdAt` timestamp of the last record from the previous fetch to start from.
 * @param {number} [limit=10] - The maximum number of items to retrieve per fetch.
 * @returns {Promise<ActionResult<PaginatedResult<User[]>>>}
 * A promise that resolves to an ActionResult containing the paginated list of users and a next cursor.
 */
export async function getUsersAction(
    filters?: {
        blocked?: boolean;
        emailVerified?: boolean;
        admin?: boolean;
        search?: string;
    },
    cursor?: string, // Cursor parameter
    limit: number = 10 // Limit per fetch
): Promise<ActionResult<PaginatedResult<User> | undefined>> {
    try {
        const conditions: any[] = []; // Using any[] for flexibility with boolean conditions

        // Filter by blocked status
        if (typeof filters?.blocked === 'boolean') {
            conditions.push(eq(schemas.user.blocked, filters.blocked));
        }

        // Filter by email verification status
        if (typeof filters?.emailVerified === 'boolean') {
            if (filters.emailVerified) {
                conditions.push(isNotNull(schemas.user.emailVerified)); // emailVerified is not null for verified
            } else {
                conditions.push(isNull(schemas.user.emailVerified)); // emailVerified is null for unverified
            }
        }

        // Filter by admin status
        if (typeof filters?.admin === 'boolean') {
            conditions.push(eq(schemas.user.admin, filters.admin));
        }

        // Search by email, first name, or last name
        if (filters?.search) {
            const searchTerm = `%${filters.search.toLowerCase()}%`;
            conditions.push(
                or(
                    like(sql`LOWER(${schemas.user.email})`, searchTerm),
                    like(sql`LOWER(${schemas.user.name})`, searchTerm),
                )
            );
        }

        // Add cursor condition: fetch users created BEFORE the cursor timestamp
        if (cursor) {
            conditions.push(lt(schemas.user.createdAt, new Date(cursor)));
        }

        // Fetch records: we fetch one more than the limit to check for hasNextPage
        const rawUsers = await DB.query.user.findMany({
            where: and(...conditions),
            orderBy: [desc(schemas.user.createdAt)], // Order by newest first
            limit: limit + 1, // Fetch N + 1 records for pagination helper
            with: {
                preferences: true, // Include preferences for each user
                bankAccounts: true, // Include bank accounts for each user
                // You can include other relations here if needed for the display
            }
        });

        // Use your provided withPagination helper to process the raw results
        const paginatedResult = await withPagination(rawUsers, limit, 'createdAt');

        return createActionResult(
            true,
            paginatedResult,
            undefined,
            "Users retrieved successfully."
        );
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to retrieve users');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Retrieves a user's details, their preferences, and all associated bank accounts.
 * This function now fully leverages Drizzle's relational queries (`.query` with `with` clauses).
 *
 * @param {string} userId - The ID of the user to retrieve.
 * @returns {Promise<ActionResult<{ user: User, preference?: Preference, bankAccounts: BankAccount[] } | undefined>>}
 * A promise that resolves to an ActionResult containing the user, their preference (if exists), and bank accounts, or an error.
 */
export async function getUserAction(
    userId: string
): Promise<ActionResult<{ user: User, preference?: Preference, bankAccounts: BankAccount[] } | undefined>> {
    try {
        const userWithDetails = await DB.query.user.findFirst({
            where: eq(schemas.user.id, userId),
            with: {
                preferences: true,
                bankAccounts: true,
            },
        });

        if (!userWithDetails) {
            return createActionResult<undefined>(false, undefined, "NotFound", "User not found.");
        }

        const { preferences, bankAccounts, ...user } = userWithDetails;

        if (!preferences) {
            return createActionResult<undefined>(false, undefined, "NotFound", "UserPreferences not found.");
        }

        // Note: The previous check `if (!preferences)` might lead to a "NotFound" for preferences
        // if they are truly optional in your schema. If preferences are expected to always exist
        // after `createPreferenceAction`, then this explicit check may not be strictly necessary
        // depending on your application's logic.
        return createActionResult<{ user: User, preference?: Preference, bankAccounts: BankAccount[] }>(true, { user, preference: preferences, bankAccounts }, undefined, "User details retrieved successfully.");
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to retrieve user details');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Retrieves a user's details, their preferences, and associated bank accounts for the profile page.
 * Uses `bankAccounts` relation instead of `cards`.
 *
 * @param {string} userId - The ID of the user to retrieve.
 * @returns {Promise<ActionResult<UserProfileData | undefined>>}
 * A promise that resolves to an ActionResult containing the user's full profile data.
 */
export async function getUserProfileDataAction(
    userId: string
): Promise<ActionResult<UserProfileData | undefined>> {
    try {
        const userWithDetails = await DB.query.user.findFirst({
            where: eq(schemas.user.id, userId),
            with: {
                preferences: true,
                bankAccounts: { // Changed from 'cards' to 'bankAccounts'
                    columns: {
                        id: true,
                        accountName: true,
                        accountNumber: true, // For display in dropdown
                        // Add other fields you need for bank account display
                    }
                }
            },
        });

        if (!userWithDetails) {
            return createActionResult<undefined>(false, undefined, "NotFound", "User not found.");
        }

        const lastSession = await DB.query.session.findFirst({
            where: eq(schemas.session.userId, userId),
            orderBy: [desc(schemas.session.createdAt)], // Get the latest session
        });

        const profileData: UserProfileData = {
            id: userWithDetails.id,
            name: userWithDetails.name,
            email: userWithDetails.email,
            image: userWithDetails.image,
            emailVerified: userWithDetails.emailVerified,
            hashedTransactionPin: userWithDetails.hashedTransactionPin,
            createdAt: userWithDetails.createdAt,
            updatedAt: userWithDetails.updatedAt,
            preferences: userWithDetails.preferences || null,
            bankAccounts: userWithDetails.bankAccounts || null,
            lastLogin: lastSession?.createdAt || null,
        };

        return createActionResult(true, profileData, undefined, "User profile details retrieved successfully.");
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to retrieve user profile details');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Promotes a specified user to an administrator role.
 * Update operations do not use the .query syntax.
 *
 * @param {string} userId - The ID of the user to promote.
 * @returns {Promise<ActionResult<User | undefined>>}
 * A promise that resolves to an ActionResult containing the updated user if successful, or an error.
 */
export async function promoteUserToAdminAction(userId: string): Promise<ActionResult<User | undefined>> {
    try {
        const [user] = await DB.update(schemas.user)
            .set({ admin: true })
            .where(eq(schemas.user.id, userId))
            .returning();

        if (!user) {
            return createActionResult<undefined>(false, undefined, "NotFound", "User not found for promotion.");
        }

        // Revalidate paths affected by promoting a user to admin
        revalidatePath(`/admin/users/${userId}`); // Specific admin user page
        revalidatePath(`/admin/users`);     // General admin users list
        revalidatePath(`/dashboard/profile`); // User's own profile might show admin status
        return createActionResult<User>(true, user, undefined, "User promoted to admin successfully.");
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to promote user to ADMIN');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Promotes a specified user to an administrator role.
 * Update operations do not use the .query syntax.
 *
 * @param {string} userId - The ID of the user to promote.
 * @returns {Promise<ActionResult<User | undefined>>}
 * A promise that resolves to an ActionResult containing the updated user if successful, or an error.
 */
export async function demoteUserFromAdminAction(userId: string): Promise<ActionResult<User | undefined>> {
    try {
        const [user] = await DB.update(schemas.user)
            .set({ admin: false })
            .where(eq(schemas.user.id, userId))
            .returning();

        if (!user) {
            return createActionResult<undefined>(false, undefined, "NotFound", "User not found for promotion.");
        }

        // Revalidate paths affected by promoting a user to admin
        revalidatePath(`/admin/users/${userId}`); // Specific admin user page
        revalidatePath(`/admin/users`);     // General admin users list
        revalidatePath(`/dashboard/profile`); // User's own profile might show admin status
        return createActionResult<User>(true, user, undefined, "User demoted from admin successfully.");
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to demote user from ADMIN');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Updates a user's profile information.
 *
 * @param {string} userId - The ID of the user to update.
 * @param {UpdateUser} values - An object containing the user fields to update.
 * @returns {Promise<ActionResult<User | undefined>>}
 * A promise that resolves to an ActionResult containing the updated user, or an error.
 */
export async function updateUserAction(
    userId: string,
    values: UpdateUser
): Promise<ActionResult<User | undefined>> {
    try {

        const existingUser = await DB.query.user.findFirst({
            where: eq(schemas.user.id, userId),
        });

        if (!existingUser) {
            return createActionResult<undefined>(false, undefined, "NotFound", "User not found for update.");
        }
        let hpin = existingUser.hashedTransactionPin;

        if (values.hashedTransactionPin) {
            hpin = await bcrypt.hash(values.hashedTransactionPin, 10)
        }
        const [updatedUser] = await DB.update(schemas.user)
            .set({ ...values, hashedTransactionPin: hpin })
            .where(eq(schemas.user.id, userId))
            .returning();

        if (!updatedUser) {
            return createActionResult<undefined>(false, undefined, "UpdateFailed", "Failed to update user profile.");
        }

        // Revalidate paths affected by user profile update
        revalidatePath(`/admin/users/${userId}`); // Specific user's admin page
        revalidatePath('/admin/users'); // General admin users list
        revalidatePath(`/dashboard/profile`); // User's own profile page
        return createActionResult<User>(true, updatedUser, undefined, "User profile updated successfully.");
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to update user profile');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}


/**
 * Updates an existing preference entry for a given user.
 * Update operations do not use the .query syntax.
 *
 * @param {string} userId - The ID of the user whose preferences to update.
 * @param {UpdatePreference} values - An object containing the preference fields to update.
 * @returns {Promise<ActionResult<{ user: User, preference: Preference } | undefined>>}
 * A promise that resolves to an ActionResult containing the user and their updated preference, or an error.
 */
export async function updatePreferenceAction(
    userId: string,
    values: UpdatePreference
): Promise<ActionResult<{ user: User, preference: Preference } | undefined>> {
    try {
        const user = await DB.query.user.findFirst({
            where: eq(schemas.user.id, userId),
        });

        if (!user) {
            return createActionResult<undefined>(false, undefined, "UserNotFound", "User does not exist. Try creating an account.");
        }

        const [preference] = await DB.update(schemas.preferences)
            .set(values)
            .where(eq(schemas.preferences.userId, userId))
            .returning();

        if (!preference) {
            return createActionResult<undefined>(false, undefined, "NotFound", "User preference not found for update.");
        }

        // Revalidate paths related to user preferences
        revalidatePath(`/dashboard/settings/preferences`);
        revalidatePath(`/dashboard/profile`); // Preferences might affect user profile display
        revalidatePath(`/admin/users/${userId}`); // If admin view includes preferences
        return createActionResult<{ user: User, preference: Preference }>(true, { user: user, preference: preference }, undefined, "Preference updated successfully.");
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to update PREFERENCES for user');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Creates a new bank account for a specified user.
 * Insert operations do not use the .query syntax.
 *
 * @param {string} userId - The ID of the user for whom to create the bank account.
 * @param {Omit<NewBankAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'accountNumber'>} accountDetails - The details for the new bank account (excluding id and timestamps).
 * @returns {Promise<ActionResult<BankAccount | undefined>>}
 * A promise that resolves to an ActionResult containing the newly created bank account, or an error.
 */
export async function createBankAccountAction(
    userId: string,
    accountDetails: Omit<NewBankAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<ActionResult<BankAccount | undefined>> {
    try {
        const user = await DB.query.user.findFirst({
            where: eq(schemas.user.id, userId),
        });

        if (!user) {
            return createActionResult<undefined>(false, undefined, "UserNotFound", "User does not exist.");
        }

        const accountNumber = await generateBankAccountNumber(accountDetails.accountType)

        if (accountDetails.isPrimary) {
            await DB.update(schemas.bankAccounts).set({ isPrimary: false }).where(
                and(
                    eq(schemas.bankAccounts.userId, userId), 
                    eq(schemas.bankAccounts.isPrimary, true),
                    not(
                        eq(schemas.bankAccounts.id, !accountDetails.accountNumber ? accountNumber : accountDetails.accountNumber)
                    )
                )
            );
        }

        const [newAccount] = await DB.insert(schemas.bankAccounts)
            .values({
                userId,
                ...accountDetails,
                accountNumber: !accountDetails.accountNumber ? accountNumber : accountDetails.accountNumber,
                balance: accountDetails.balance ?? "0.00",
                currency: accountDetails.currency ?? "USD",
                status: accountDetails.status ?? 'active',
            })
            .returning();

        // Revalidate paths affected by creating a bank account
        revalidatePath(`/dashboard`); // General accounts list
        revalidatePath(`/dashboard/bank-accounts`); // Newly created account's page
        revalidatePath(`/dashboard/cards`); // User's profile might show linked accounts
        revalidatePath(`/admin/users`); // If admin view includes user's accounts
        return createActionResult<BankAccount>(true, newAccount, undefined, "Bank account created successfully.");
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to create bank account');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Updates an existing bank account for a user.
 * Update operations do not use the .query syntax.
 *
 * @param {string} userId - The ID of the user who owns the bank account (for security/authorization).
 * @param {string} accountId - The ID of the bank account to update.
 * @param {UpdateBankAccount} values - An object containing the bank account fields to update.
 * @returns {Promise<ActionResult<BankAccount | undefined>>}
 * A promise that resolves to an ActionResult containing the updated bank account, or an error.
 */
export async function updateBankAccountAction(
    userId: string,
    accountId: string,
    values: UpdateBankAccount
): Promise<ActionResult<BankAccount | undefined>> {
    try {
        const existingAccount = await DB.query.bankAccounts.findFirst({
            where: eq(schemas.bankAccounts.id, accountId),
        });

        if (!existingAccount) {
            return createActionResult<undefined>(false, undefined, "NotFound", "Bank account not found.");
        }

        if (existingAccount.userId !== userId) {
            return createActionResult<undefined>(false, undefined, "Unauthorized", "You are not authorized to update this account.");
        }

        const [updatedAccount] = await DB.update(schemas.bankAccounts)
            .set(values)
            .where(eq(schemas.bankAccounts.id, accountId))
            .returning();

        if (values.isPrimary) {
            await DB.update(schemas.bankAccounts).set({ isPrimary: false }).where(
                and(
                    eq(schemas.bankAccounts.userId, userId),
                    eq(schemas.bankAccounts.isPrimary, true),
                    not(
                        eq(schemas.bankAccounts.id, accountId)
                    )
                )
            );
        }

        if (!updatedAccount) {
            return createActionResult<undefined>(false, undefined, "UpdateFailed", "Failed to update bank account.");
        }

        // Revalidate paths affected by updating a bank account
        revalidatePath(`/dashboard`); // General accounts list
        revalidatePath(`/dashboard/bank-accounts`); // Newly created account's page
        revalidatePath(`/dashboard/cards`); // User's profile might show linked accounts
        revalidatePath(`/admin/users`); // If admin view includes user's accounts
        return createActionResult<BankAccount>(true, updatedAccount, undefined, "Bank account updated successfully.");
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to update bank account');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}

/**
 * Fetches all bank accounts for a given user, including their account number and current balance.
 * This is designed to be used in a component like a `withdrawalModal` to populate a select field.
 *
 * @param {string} userId - The ID of the user whose bank accounts to fetch.
 * @returns {Promise<ActionResult<BankAccount[] | undefined>>}
 * A promise that resolves to an ActionResult containing an array of bank accounts with their balance, or an error.
 */
export async function getBankAccountsWithBalanceAction(
    userId: string
): Promise<ActionResult<BankAccount[] | undefined>> {
    try {
        const userAccounts = await DB.query.bankAccounts.findMany({
            where: eq(schemas.bankAccounts.userId, userId),
        });

        if (!userAccounts || userAccounts.length === 0) {
            return createActionResult<undefined>(false, undefined, "NotFound", "No bank accounts found for this user.");
        }

        return createActionResult<BankAccount[]>(
            true,
            userAccounts,
            undefined,
            "Bank accounts retrieved successfully."
        );
    } catch (error: any) {
        const err = new Error(error.message || 'Failed to retrieve bank accounts');
        return createActionResult<undefined>(false, undefined, err.name || "ServerError", err.message);
    }
}