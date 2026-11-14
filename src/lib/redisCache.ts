import config from '@/config';
import Redis from 'ioredis';

const redis = new Redis(config.REDIS_URL);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function cacheData(key: string, fetchData: any | null, expires: number = 3 * 60 * 60 * 1000): Promise<any> {
    const cachedData = await redis.get(key);

    if (cachedData) {
        return JSON.parse(cachedData);
    } else {
        const freshData = await fetchData();
        await redis.set(key, JSON.stringify(freshData), 'EX', expires); // Cache for 3 hours
        return freshData;
    }
}