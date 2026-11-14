import winston from "winston";
import TelegramLogger from "winston-telegram";
import DailyRotateFile from "winston-daily-rotate-file";

import config from "@/config";

const { combine, timestamp, json, errors, colorize, printf } = winston.format;

// Declare a global variable for the logger to implement the singleton pattern.
// This is necessary for Next.js development mode to prevent multiple logger instances.
declare global {
    var globalLogger: winston.Logger | undefined;
}

/**
 * Configures and returns a Winston logger instance with daily file rotation.
 * Logs are formatted as JSON and include timestamps and error stack traces.
 * Exception and rejection handlers are configured to log to separate files.
 *
 * The logging level is determined by the NODE_ENV environment variable, defaulting to 'info'.
 * Log files are rotated daily, kept for 90 days, and have a maximum size of 5MB.
 *
 * @param {string} [serviceName] - Optional. The name of the service or module using the logger.
 * This will be included in the log metadata. Defaults to "web" if not provided.
 * @returns {winston.Logger} A configured Winston logger instance.
 *
 * @example
 * // Import the logger function
 * import { logger } from './path/to/your/logger';
 *
 * // Get a logger instance for a specific service
 * const myServiceLogger = logger('UserService');
 *
 * // Use the logger to log messages
 * myServiceLogger.info('User created successfully', { userId: 123 });
 * myServiceLogger.error('Failed to fetch user data', { error: err.message });
 *
 * @example
 * // Get a logger instance with the default service name ("web")
 * const defaultLogger = logger();
 * defaultLogger.warn('Something unusual happened');
 */
export function logger(serviceName?: string): winston.Logger {
    const isProduction = config.NODE_ENV === "production";
    const service = serviceName || (isProduction ? "api" : "web");
    const level = isProduction ? "info" : "debug";

    // Use the global logger instance if it already exists (singleton pattern)
    if (global.globalLogger) {
        // If a serviceName is provided, update the defaultMeta for the existing logger
        if (serviceName) {
            global.globalLogger.defaultMeta = { ...global.globalLogger.defaultMeta, service };
        }
        return global.globalLogger;
    }

    // Base logger configuration
    const loggerConfig: winston.LoggerOptions = {
        exitOnError: false,
        level,
        defaultMeta: { service },
        format: combine(
            errors({ stack: true }),
            timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // More precise timestamp
            isProduction
                ? json()
                : combine(
                    colorize(),
                    printf((info) => {
                        const stack = info.stack ? `\n${info.stack}` : "";
                        return `[WINSTON][${info.timestamp}] ${info.level}: ${info.message}${stack}`;
                    })
                )
        ),
        transports: [new winston.transports.Console()],
        exceptionHandlers: [new winston.transports.File({ filename: "exception.log" })],
        rejectionHandlers: [new winston.transports.File({ filename: "rejections.log" })],
    };

    // Production-specific configurations
    if (isProduction) {
        const fileRotateTransport = new DailyRotateFile({
            filename: "log-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxFiles: "90d",
            maxSize: "5mb",
        });

        // Ensure transports is always an array before pushing
        if (!Array.isArray(loggerConfig.transports)) {
            loggerConfig.transports = loggerConfig.transports ? [loggerConfig.transports] : [];
        }
        loggerConfig.transports.push(fileRotateTransport);

        // Add Telegram transport if configured and valid
        const telegramToken = config.TELEGRAM_TOKEN;
        const telegramAdmin = config.TELEGRAM_ADMIN;

        if (
            telegramToken &&
            telegramToken.length > 2 &&
            telegramAdmin &&
            telegramAdmin.length > 2 &&
            !isNaN(Number(telegramAdmin))
        ) {
            try {
                const telegramTransport = new TelegramLogger({
                    token: telegramToken,
                    chatId: Number(telegramAdmin),
                    level: "error", // Only send error logs to Telegram
                    unique: true,
                    handleExceptions: true,
                });
                loggerConfig.transports.push(telegramTransport);
            } catch (error) {
                console.error("[WINSTON] ERROR - Failed to initialize Telegram logger:", error);
            }
        } else {
            console.info("[WINSTON] INFO - Running without Telegram transport (environment variables not properly configured).");
        }
    }

    const log = winston.createLogger(loggerConfig);

    // In development, we want a more concise console output from the main logger.
    // The existing console transport is good for production. For development, we'll
    // replace or modify it directly within the transports array if needed.
    // Given the current setup, the `isProduction ? json() : combine(colorize(), printf(...))`
    // already handles the difference in console output. No extra `log.add` is needed here
    // as it would add a *second* console transport.

    // Assign the newly created logger to the global variable
    global.globalLogger = log;

    return log;
}

export type Logger = winston.Logger;