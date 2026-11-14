import config from "@/config";
import type { Config } from "drizzle-kit";

export default {
    schema: "./src/db/schemas",
    out: "./drizzle",
    dialect: "postgresql",
    casing: "snake_case",
    dbCredentials: {
        url: config.DATABASE_URL,
    },
    verbose: true,
    strict: true
} satisfies Config;