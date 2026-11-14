import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import schemas from "@/db/schemas"
import config from "@/config";
import { obfuscateUrl } from "./helpers/obfsucator";
// import { logger } from "@/lib/logger";

type DBType = PostgresJsDatabase<typeof schemas>;


export function db(): DBType {
    if (!global.drizzleDb) {
        // const log = logger("database");
        // Validate !config.DATABASE_URL exists before proceeding
        if (!config.DATABASE_URL) {
            const error = new Error("Database URL is required");
            // console.error(error.message);
            throw error;
        }

        const db_url = config.DATABASE_URL

        try {

            if (config.NODE_ENV !== "production") {
                console.info("Initializing drizzle database");
                console.info(`Initializing drizzle database with URL: ${obfuscateUrl(db_url)}`);
            }

            const sql = postgres(db_url);
            global.drizzleDb = drizzle<typeof schemas>({
                client: sql,
                schema: schemas,
                casing: "snake_case",
                logger: config.NODE_ENV !== "production" ? true : false
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            const err = error instanceof Error ? error : new Error(String(error));
            // console.error(`Database connection failed: ${err.message}`);
            throw err;
        }
    }

    return global.drizzleDb;
};

export const DB = db()
