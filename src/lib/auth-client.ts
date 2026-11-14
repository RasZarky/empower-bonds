import config from "@/config"
import { createAuthClient } from "better-auth/react"
import { deviceAuthorizationClient, inferAdditionalFields, lastLoginMethodClient, multiSessionClient, passkeyClient, twoFactorClient } from "better-auth/client/plugins"
import { toast } from "sonner";
import { auth } from "./auth";

export const authClient = createAuthClient({
    baseURL: config.BASE_URL,
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