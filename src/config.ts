import "dotenv/config"

const config = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
    EXCHANGE_KEY: process.env.EXCHANGERATE_KEY || '',
    COINLAYER_KEY: process.env.COINLAYER_KEY || '',
    DATABASE_URL: process.env.DATABASE_URL || '',
    TELEGRAM_TOKEN: process.env.TG_TOKEN || '',
    TELEGRAM_ADMIN: process.env.TG_ADMIN || '',
    EMAIL_COMPLAINTS: process.env.NEXT_PUBLIC_COMPLAINTS_EMAIL || 'complaints@empowerbonds.com',
    BASE_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:6000',
    FROM_EMAIL: process.env.FROM_EMAIL || "Empower Bonds <delivery@resend.dev>",
    TRUSTED_ORIGINS: process.env.TRUSTED_ORIGINS ? process.env.TRUSTED_ORIGINS?.split(",") : ["http://localhost:3000", "http://127.0.0.1:3000", "https://empowerbonds.online", "https://empowerbonds.site"],
    // Never hard-code this: the config object is imported by client components,
    // so any literal value here would ship in the public JS bundle.
    RESEND_API_KEY: process.env.RESEND_API_KEY || "",
    // NEXT_PUBLIC_TITLE comes first because only public variables reach client components.
    TITLE: process.env.NEXT_PUBLIC_TITLE || process.env.TITLE || "Empower Bonds",
    CLOUDINARY_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_NAME || "",
    CLOUDINARY_API: process.env.NEXT_PUBLIC_CLOUDINARY_API || "",
    CLOUDINARY_SECRET: process.env.NEXT_PUBLIC_CLOUDINARY_SECRET || "",
    SUPPORT: process.env.NEXT_PUBLIC_COMPLAINTS_EMAIL || "support@empowerbonds.com",
};

export default config;