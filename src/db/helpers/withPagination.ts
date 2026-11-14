// Import all necessary types from your consolidated database types file
import config from "@/config";
import type {
    User,
    Account,
    Passkey,
    Session,
    SocialSecurity,
    Verification,
    Preference,
    NotificationSetting,
    BankAccount,
    Card,
    Transaction,
    LoanRequest,
    LoanApproval,
    LoanRepayment,
    Budget,
    BudgetCategory,
    Expenditure,
    ActualExpenditureRecord,
    BudgetWithCategories, // This is a composite type
    ActionResult,
    PaginatedResult,
} from "@/types/db"; // Assuming all schema types and utility types are now exported from here

/**
 * Defines a union type of all possible Drizzle ORM table select types.
 * This is used to constrain the generic type `T` in functions that operate on
 * different schema entities.
 *
 * Note: Composite types like `BudgetWithCategories` are included, but when
 * using `withPagination` with such types, ensure `cursorField` correctly
 * points to a sortable field within the composite structure (e.g., `item.budget.createdAt`).
 */
type SchemaType =
    | User
    | Account
    | Passkey
    | Session
    | SocialSecurity
    | Verification
    | Preference
    | NotificationSetting
    | BankAccount
    | Card
    | Transaction
    | LoanRequest
    | LoanApproval
    | LoanRepayment
    | Budget
    | BudgetCategory
    | Expenditure
    | ActualExpenditureRecord
    | BudgetWithCategories;

/**
 * Applies cursor-based pagination formatting to an array of already fetched data.
 * This function is intended to process results from a database query that
 * has already applied `LIMIT (pageSize + 1)` and `ORDER BY cursorField`.
 *
 * @template T - The type of items in the data array (must extend SchemaType).
 * @param {T[]} data - The array of data, expected to be sorted by `cursorField` and potentially contain `pageSize + 1` items.
 * @param {number} pageSize - The desired number of items per page.
 * @param {keyof T} [cursorField='createdAt'] - The field to use for determining the next cursor.
 * This field must exist on type `T` and be sortable (e.g., timestamp, string, number).
 * @returns {Promise<PaginatedResult<T>>} A promise that resolves to a cursor-paginated result object.
 */
export async function withPagination<T extends SchemaType>(
    data: T[],
    pageSize: number,
    cursorField?: keyof T
): Promise<PaginatedResult<T>> {
    // Basic validation for pageSize
    if (pageSize <= 0) {
        return {
            success: false,
            data: [],
            pageSize: pageSize,
            nextCursor: null,
            hasNextPage: false,
        };
    }

    let hasNextPage = false;
    let nextCursor: string | Date | number | null = null;
    let resultData = data;

    // Default cursor field to 'createdAt' if not provided
    const effectiveCursorField = (cursorField ?? 'createdAt') as keyof T;

    // If the data array contains more items than the requested pageSize,
    // it means there's a next page.
    if (data.length > pageSize) {
        hasNextPage = true;
        // Slice the array to return only the requested number of items
        resultData = data.slice(0, pageSize);
        // The cursor for the next page is the cursorField value of the last item on the current page
        const lastItem = resultData[resultData.length - 1];

        // Ensure the cursor field exists and is of a valid cursor type
        if (lastItem && lastItem[effectiveCursorField] !== undefined) {
            nextCursor = lastItem[effectiveCursorField] as Date | string | number;
        } else {
            // Fallback if cursorField is not found or invalid on the last item
            if (config.NODE_ENV !== "production")
                console.warn(`Cursor field '${String(effectiveCursorField)}' not found or invalid on the last item for pagination.`);
            hasNextPage = false; // Cannot determine next cursor accurately
            nextCursor = null;
        }
    }

    return {
        success: true,
        data: resultData,
        pageSize: pageSize,
        nextCursor,
        hasNextPage,
    };
}

/**
 * Creates a standardized `ActionResult` object for API responses.
 * This helper ensures a consistent structure for conveying success/failure, data, and messages/errors.
 *
 * @template T - The type of data to be returned in case of success.
 * @param {boolean} success - Indicates whether the action was successful.
 * @param {T} [data] - Optional data payload to return on success.
 * @param {string} [error] - Optional error message to provide on failure.
 * @param {string} [message] - Optional general message (e.g., success message, warning).
 * @returns {ActionResult<T>} An object conforming to the `ActionResult` interface.
 */
export function createActionResult<T>(
    success: boolean,
    data?: T,
    error?: string,
    message?: string
): ActionResult<T> {
    // Ensure that if 'success' is true, 'error' is not set, and vice-versa for clarity.
    if (success && error) {
        if (config.NODE_ENV !== "production")
            console.warn("createActionResult: 'error' provided for a successful action. Ignoring 'error'.");
        error = undefined;
    } else if (!success && !error) {
        // If not successful but no error is provided, set a generic error message.
        error = "An unknown error occurred.";
    }

    return { success, data, error, message };
}