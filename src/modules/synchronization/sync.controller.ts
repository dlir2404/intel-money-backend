import {Body, Controller, Get, Post, Query} from "@nestjs/common";
import {SyncService} from "./synce.service";
import {GetNotSyncDataRequest, SyncRequest} from "./dto";
import {CurrentUserId, UserAuth} from "../../shared/decorators/auth";
import {BaseResponse} from "../../shared/types/base";

@Controller("sync-manager")
export class SyncController {
    constructor(private readonly syncService: SyncService) { }

    @Get("not-sync-data")
    @UserAuth()
    async getNotSyncData(@Query() query: GetNotSyncDataRequest, @CurrentUserId() userId: number) {
        return this.syncService.getNotSyncData(userId, query.lastSyncTime);
    }

    @Post("sync")
    @UserAuth()
    async sync(@CurrentUserId() userId: number, @Body() body: SyncRequest) {
        return await this.syncService.syncData(userId, body);
    }
}