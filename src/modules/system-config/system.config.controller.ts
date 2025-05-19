import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { SystemConfigService } from "./system.config.service";
import { CreateSystemConfigDto, SystemConfigResponse, UpdateSystemConfigDto } from "./dto";
import { ApiResponse } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/types/base";
import { AdminAuth } from "src/shared/decorators/auth";

@Controller('system-config')
export class SystemConfigController {
    constructor(private readonly sysConfigService: SystemConfigService) { }

    @Get('all')
    @AdminAuth()
    @ApiResponse({
        status: 200,
        type: [SystemConfigResponse],
        description: 'The record has been successfully retrieved.',
    })
    async getAllSystemConfig() {
        return this.sysConfigService.getAllSystemConfig();
    }


    @Post('create')
    @ApiResponse({
        status: 201,
        type: BaseResponse,
        description: 'The record has been successfully created.',
    })
    @AdminAuth()
    async createSystemConfig(@Body() body: CreateSystemConfigDto) {
        await this.sysConfigService.createSystemConfig(body);

        return new BaseResponse({ result: true });
    }

    @Post(':id/update')
    @ApiResponse({
        status: 200,
        type: BaseResponse,
        description: 'The record has been successfully updated.',
    })
    @AdminAuth()
    async updateSystemConfig(@Body() body: UpdateSystemConfigDto, @Param('id') id: number) {
        await this.sysConfigService.updateSystemConfig(id, body.value);

        return new BaseResponse({ result: true });
    }

    @Delete(':id')
    @ApiResponse({
        status: 200,
        type: BaseResponse,
        description: 'The record has been successfully deleted.',
    })
    @AdminAuth()
    async deleteSystemConfig(@Param('id') id: number) {
        await this.sysConfigService.deleteSystemConfig(id);

        return new BaseResponse({ result: true });
    }
}