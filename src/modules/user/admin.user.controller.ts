import { Body, Controller, Get, Param, Put, Query } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { AdminUserService } from "./admin.user.service";
import { plainToInstance } from "class-transformer";
import { GetListUsersRequest, ListUserResponse, SetVipRequest, UserResponse } from "./user.dto";
import { AdminAuth } from "src/shared/decorators/auth";

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
}