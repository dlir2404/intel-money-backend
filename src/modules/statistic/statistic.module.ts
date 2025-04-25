import { Module } from "@nestjs/common";
import { StatisticService } from "./statistic.service";
import { StatisticController } from "./statistic.controller";
import { AppCacheModule } from "../cache/cache.module";

@Module({
    imports: [AppCacheModule],
    controllers: [StatisticController],
    providers: [StatisticService],
    exports: [StatisticService]
})
export class StatisticModule {}