import config from "@/config";
import type { Metadata } from "next/types";

export function createMetadata(override: Metadata): Metadata {
    return {
        ...override,
        openGraph: {
            title: override.title ?? undefined,
            description: override.description ?? undefined,
            url: "https://empowerbonds.com",
            images: "https://empowerbonds.com/images/logo/shape-30@2x.png",
            siteName: config.TITLE,
            ...override.openGraph,
        },
        twitter: {
            card: "summary_large_image",
            creator: "@beakcru",
            title: override.title ?? undefined,
            description: override.description ?? undefined,
            images: "https://empowerbonds.com/images/logo/shape-30@2x.png",
            ...override.twitter,
        },
    };
}

export const baseUrl =
    config.NODE_ENV !== "production"
        ? new URL("http://localhost:3000")
        : new URL(config.BASE_URL);