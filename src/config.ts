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
    EMAIL_COMPLAINTS: process.env.NEXT_PUBLIC_COMPLAINTS_EMAIL || 'complaints@mail.com',
    BASE_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:6000',
    FROM_EMAIL: process.env.FROM_EMAIL || "Empower Bonds <delivery@resend.dev>",
    TRUSTED_ORIGINS: process.env.TRUSTED_ORIGINS ? process.env.TRUSTED_ORIGINS?.split(",") : ["http://localhost:3000", "http://127.0.0.1:3000", "https://empowerbonds.online", "https://empowerbonds.site"],
    RESEND_API_KEY: process.env.RESEND_API_KEY || "re_TAchGk8E_HUYcMQkUjJt1sZMpiTgfLvwj",
    TITLE: process.env.TITLE || process.env.NEXT_PUBLIC_TITLE,
    CLOUDINARY_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_NAME || "",
    CLOUDINARY_API: process.env.NEXT_PUBLIC_CLOUDINARY_API || "",
    CLOUDINARY_SECRET: process.env.NEXT_PUBLIC_CLOUDINARY_SECRET || "",
    TEL: "+1 (209) 489-8379",
    ADDRESS: "somewhere in nebraska",
    SUPPORT: process.env.NEXT_PUBLIC_COMPLAINTS_EMAIL || "complaint@gmail.com",
    LINKEDIN: "https://linkedin.com/in/empowerbonds",
    FACEBOOK: "https://facebook.com/empowerbonds",
    TWITTERX: "https://x.com/empowerbonds",
    MAP: "https://www.google.com/maps/place/Hewlett+Packard+Enterprise/@37.4191639,-121.9788323,17z/data=!3m1!4b1!4m6!3m5!1s0x808fc97684d9a35b:0xae8fc47085aeb8d!8m2!3d37.4191639!4d-121.9788323!16s%2Fg%2F11h6l7ryhg?entry=ttu&g_ep=EgoyMDI1MTAwNi4wIKXMDSoASAFQAw%3D%3D"
};

export default config;