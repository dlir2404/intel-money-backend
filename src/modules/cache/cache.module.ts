import { Module } from "@nestjs/common";
import { AppCacheService } from "./cache.service";
import { ConfigService } from "@nestjs/config";
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from "@keyv/redis";

@Module({
    imports: [
        CacheModule.registerAsync({
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
            stores: [
                createKeyv({
                    url: configService.get<string>("REDIS_CONNECTION") ?? 'redis://localhost:6379'
                }),
              ],
            }),
        }),
    ], 
    providers: [AppCacheService],
    exports: [AppCacheService],
})
export class AppCacheModule {}