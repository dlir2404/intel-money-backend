import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { SystemConfigService } from "./system.config.service";
import { CreateSystemConfigDto, SystemConfigResponse, UpdateSystemConfigDto } from "./dto";
import { ApiResponse } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/types/base";
import { AdminAuth } from "src/shared/decorators/auth";

@Controller('system-config')
export class SystemConfigController {
    constructor(private readonly sysConfigService: SystemConfigService) { }

    @Get()
    @ApiResponse({
        status: 200,
        type: SystemConfigResponse,
        description: 'The record has been successfully retrieved.',
    })
    async getAllSystemConfig() {
        return this.sysConfigService.getSysConfig();
    }

    @Put()
    @ApiResponse({
        status: 200,
        type: BaseResponse,
        description: 'The record has been successfully updated.',
    })
    @AdminAuth()
    async updateSystemConfig(@Body() body: UpdateSystemConfigDto) {
        await this.sysConfigService.updateSystemConfig(body);

        return new BaseResponse({ result: true });
    }
}