import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkey } from "better-auth/plugins/passkey"
import { DB } from "@/db"; // your drizzle instance
import schemas from "@/db/schemas/index"
import { multiSession } from "better-auth/plugins/multi-session";
import { nextCookies } from "better-auth/next-js";
import config from "@/config";
import { resend } from "./email/resend";
import { reactResetPasswordEmail } from "./email/resetPassword";
import { VerifyEmail } from "./email/verifyEmail";
import { twoFactor } from "better-auth/plugins/two-factor";
import { deviceAuthorization, lastLoginMethod, openAPI } from "better-auth/plugins";
import { OTPEmail } from "./email/otpEmail";

export const auth = betterAuth({
    appName: config.TITLE,
    baseURL: config.BASE_URL,
    database: drizzleAdapter(DB, {
        provider: "pg",
        schema: schemas
    }),
    plugins: [
        passkey(),
        multiSession(),
        openAPI(),
        nextCookies(),
        twoFactor({
            otpOptions: {
                async sendOTP({ user, otp }) {
                    await resend.emails.send({
                        from: config.FROM_EMAIL,
                        to: user.email,
                        subject: "Your OTP",
                        react: OTPEmail({
                            username: user.name || user.id,
                            otp
                        }),
                    });
                },
            },
        }),
        deviceAuthorization({
            expiresIn: "3min",
            interval: "5s",
        }),
        lastLoginMethod(),
    ],
    user: {
        additionalFields: {
            admin: {
                type: "boolean",
                defaultValue: false,
                default: false
            },
            blocked: {
                type: "boolean",
                defaultValue: false,
                default: false
            },
            hashedTransactionPin: {
                type: "string",
                unique: false,
            }
        }
    },
    emailVerification: {
        autoSignInAfterVerification: true,
        sendOnSignUp: true,
        sendOnSignIn: true,
        async sendVerificationEmail({ user, url }) {
            const { data, error } = await resend.emails.send({
                from: config.FROM_EMAIL,
                to: user.email,
                subject: "Verify your email address",
                react: VerifyEmail({
                    username: user.name || user.id,
                    verifyLink: url
                })
            });

            if (error) {
                // if (config.NODE_ENV !== "production")
                console.error(error.name || "Email Error", {
                    description: {
                        message: error.message || "There was an error sending the email to you.",
                        params: config.FROM_EMAIL,
                        key: config.RESEND_API_KEY
                    }
                });
            }

            else if (data) {
                // if (config.NODE_ENV !== "production")
                console.info("Email Sent", { description: data.id })
            }
        },
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        async sendResetPassword({ user, token }) {
            const { data, error } = await resend.emails.send({
                from: config.FROM_EMAIL,
                to: user.email,
                subject: "Reset your password",
                react: reactResetPasswordEmail({
                    token,
                    username: user.email,
                }),
            });

            if (error) {
                if (config.NODE_ENV !== "production")
                    console.error("Email Error", { description: error.message });
            }

            else if (data) {
                if (config.NODE_ENV !== "production")
                    console.info("Email Sent", { description: data.id })
            }
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60 // Cache duration in seconds
        }
    },
    trustedOrigins: config.TRUSTED_ORIGINS
});

export type AuthSession = typeof auth.$Infer.Session
export type AuthUser = typeof auth.$Infer.Session.user