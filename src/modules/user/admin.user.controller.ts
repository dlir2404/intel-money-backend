import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { AdminUserService } from "./admin.user.service";
import { plainToInstance } from "class-transformer";
import { DisableVipRequest, GetListUsersRequest, ListUserResponse, SetVipRequest, UserResponse } from "./user.dto";
import { AdminAuth } from "src/shared/decorators/auth";
import { BaseResponse } from "src/shared/types/base";

@ApiTags('Admin user')
@Controller('admin/user')
export class AdminUserController {
    constructor(private readonly adminUserService: AdminUserService) {}

    @Get('all')
    @ApiResponse({
        type: ListUserResponse
    })
    @AdminAuth()
    async getListUsers(@Query() query: GetListUsersRequest) {
        const results = await this.adminUserService.getListUsers(query);
        return plainToInstance(ListUserResponse, results);
    }

    @Put('/:id/vip')
    @ApiResponse({
        type: UserResponse
    })
    @AdminAuth()
    async setVip(@Body() body: SetVipRequest, @Param('id') id: number) {
        const results = await this.adminUserService.setVip(id, body.vipExpirationDate);

        return plainToInstance(UserResponse, results);
    }

    @Post('vip/disable')
    @ApiResponse({
        type: BaseResponse
    })
    @AdminAuth()
    async disableVip(@Body() body: DisableVipRequest) {
        const results = await this.adminUserService.disableVip(body.userId);

        return { result: true };
    }
}