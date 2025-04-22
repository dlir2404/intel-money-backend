import { Controller, Get } from "@nestjs/common";
import { StatisticService } from "./statistic.service";
import { ApiResponse } from "@nestjs/swagger";
import { StatisticData } from "./statistic.dto";
import { CurrentUserId, UserAuth } from "src/shared/decorators/auth";

@Controller("statistic")
export class StatisticController {
    constructor(private readonly statisticService: StatisticService) {}

    @Get("today")
    @ApiResponse({
        status: 200,
        type: StatisticData,
    })
    @UserAuth()
    async getTodayStatistic(@CurrentUserId() userId: number) {
        return await this.statisticService.getTodayStatistic(userId);
    }
}