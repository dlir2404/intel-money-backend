import { Controller, Get, Query } from "@nestjs/common";
import { StatisticService } from "./statistic.service";
import { ApiResponse } from "@nestjs/swagger";
import {
    CompactStatisticData,
    CustomRangeStatisticRequest,
    StatisticData,
    StatisticDataByDayRequest
} from "./statistic.dto";
import { CurrentUserId, UserAuth } from "src/shared/decorators/auth";
import { query } from "express";

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


    @Get("this-week")
    @ApiResponse({
        status: 200,
        type: StatisticData,
    })
    @UserAuth()
    async getThisWeekStatistic(@CurrentUserId() userId: number) {
        return await this.statisticService.getThisWeekStatistic(userId);
    }


    @Get("this-month")
    @ApiResponse({
        status: 200,
        type: StatisticData,
    })
    @UserAuth()
    async getThisMonthStatistic(@CurrentUserId() userId: number) {
        return await this.statisticService.getThisMonthStatistic(userId);
    }


    @Get("this-quarter")
    @ApiResponse({
        status: 200,
        type: StatisticData,
    })
    @UserAuth()
    async getThisQuarterStatistic(@CurrentUserId() userId: number) {
        return await this.statisticService.getThisQuarterStatistic(userId);
    }


    @Get("this-year")
    @ApiResponse({
        status: 200,
        type: StatisticData,
    })
    @UserAuth()
    async getThisYearStatistic(@CurrentUserId() userId: number) {
        return await this.statisticService.getThisYearStatistic(userId);
    }
    
    @Get("by-day")
    @ApiResponse({
        status: 200,
        type: CompactStatisticData,
    })
    @UserAuth()
    async getByDayStatistic(@CurrentUserId() userId: number, @Query() query: StatisticDataByDayRequest) {
        return await this.statisticService.getByDayStatistic(userId, query);
    }

    @Get("by-month")
    @ApiResponse({
        status: 200,
        type: CompactStatisticData,
    })
    @UserAuth()
    async getByMonthStatistic(@CurrentUserId() userId: number, @Query() query: StatisticDataByDayRequest) {
        return await this.statisticService.getByMonthStatistic(userId, query);
    }

    @Get("by-year")
    @ApiResponse({
        status: 200,
        type: CompactStatisticData,
    })
    @UserAuth()
    async getByYearStatistic(@CurrentUserId() userId: number, @Query() query: StatisticDataByDayRequest) {
        return await this.statisticService.getByYearStatistic(userId, query);
    }

    @Get("custom-range")
    @ApiResponse({
        status: 200,
        type: CompactStatisticData,
    })
    async getCustomRangeStatistic(@CurrentUserId() userId: number, @Query() query: CustomRangeStatisticRequest) {
        return await this.statisticService.getCustomRangeStatistic(userId, query);
    }
}