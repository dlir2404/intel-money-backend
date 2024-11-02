import { Controller, Get, Query } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { AdminUserService } from "./admin.user.service";
import { plainToInstance } from "class-transformer";
import { GetListUsersRequest, ListUserResponse } from "./user.dto";
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
}