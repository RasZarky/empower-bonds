/**
 * Represents a paginated result set with metadata.
 * @template T - The type of items in the data array.
 */
export type PaginatedResult<T> = {
    success: boolean;
    /** Array of paginated items */
    data: T[];
    /** Number of items per page */
    pageSize: number;
    /** The cursor for the next page (null if no more pages) */
    nextCursor: string | Date | number | null;
    /** Whether there are more pages available */
    hasNextPage: boolean;
};

/**
 * Represents a generic action result, indicating success or failure.
 * @template T - The type of data returned on success.
 */
export interface ActionResult<T> {
    success: boolean;
    data?: T;
    error?: string; // Standardized error message
    message?: string; // General informational message
    // Optionally add a code for specific error handling (e.g., 'NOT_FOUND', 'UNAUTHORIZED')
    code?: string;
}

export type TransferProp = {
    amount: number;
    rec_bank_name: string;
    rec_acc_number: string;
    rec_name: string;
    sort_code?: string;
}

export interface PostProp {
    slug: string;
    title: string;
    author: string;
    category: string;
    publishedDate: string;
    createdDate: string;
    featured: boolean;
    image: string;
    content: string;
}