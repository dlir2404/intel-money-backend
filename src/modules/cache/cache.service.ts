import { Inject, Injectable } from "@nestjs/common";
import { Cache } from 'cache-manager';

@Injectable()
export class AppCacheService {
    constructor(@Inject('CACHE_MANAGER') private cache: Cache) {}

    async get(key: string) {
        return await this.cache.get(key);
    }

    async set(key: string, value: any, ttlSeconds = 3600) {
        await this.cache.set(key, value, ttlSeconds * 1000);
    }

    async del(key: string) {
        await this.cache.del(key);
    }
}