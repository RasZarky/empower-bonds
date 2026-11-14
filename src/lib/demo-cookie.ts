/**
 * Name of the cookie that marks a browser as browsing the read-only demo
 * dashboard. Kept in its own module so `middleware.ts` can import it without
 * pulling the database/auth modules into the edge runtime.
 */
export const DEMO_COOKIE = "empower_demo"
