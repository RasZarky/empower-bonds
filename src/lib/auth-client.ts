import config from "@/config"
import { createAuthClient } from "better-auth/react"
import { deviceAuthorizationClient, inferAdditionalFields, lastLoginMethodClient, multiSessionClient, passkeyClient, twoFactorClient } from "better-auth/client/plugins"
import { toast } from "sonner";
import { auth } from "./auth";

/**
 * In the browser, talk to the origin the page is actually served from. Pinning
 * this to NEXT_PUBLIC_BETTER_AUTH_URL breaks local development whenever Next
 * picks a port other than the one in .env (port 3000 already in use, previews,
 * tunnels), and the request fails with "Failed to fetch" before it reaches the
 * API. The server keeps using the configured base URL.
 */
const baseURL =
    typeof window !== "undefined" ? window.location.origin : config.BASE_URL

export const authClient = createAuthClient({
    baseURL,
    plugins: [
        twoFactorClient({
            onTwoFactorRedirect() {
                window.location.href = "/two-factor";
            },
        }),
        passkeyClient(),
        multiSessionClient(),
        deviceAuthorizationClient(),
        lastLoginMethodClient(),
        inferAdditionalFields<typeof auth>(),
    ],
    fetchOptions: {
        onError(e) {
            if (e.error.status === 429) {
                toast.error("Too many requests. Please try again later.");
            }
        },
    },
})
