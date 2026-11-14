import type { MetadataRoute } from "next"
import config from "@/config"

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: config.BASE_URL,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 1,
		},
		{
			url: `${config.BASE_URL}/about`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 1,
		},
		{
			url: `${config.BASE_URL}/careers`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.8,
		},
		{
			url: `${config.BASE_URL}/security`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.5,
		},
		{
			url: `${config.BASE_URL}/auth/register`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 1,
		},
		{
			url: `${config.BASE_URL}/auth/login`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 1,
		}
	]
}
