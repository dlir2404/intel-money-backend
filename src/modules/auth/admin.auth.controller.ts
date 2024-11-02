import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { AdminAuthService } from "./admin.auth.service";
import { LoginRequest, LoginResponse, RegisterRequest } from "./auth.dto";
import { AdminAuth, CurrentUserId } from "src/shared/decorators/auth";
import { plainToInstance } from 'class-transformer';
import { UserResponse } from "../user/user.dto";
import { BaseResponse } from "src/shared/types/base";

@ApiTags('Admin auth')
@Controller('auth/admin')
export class AdminAuthController {
    constructor(private readonly adminAuthService: AdminAuthService) {}
    @Post('register')
    @ApiResponse({
        type: BaseResponse
    })
    async register(@Body() body: RegisterRequest) {
        return this.adminAuthService.register(body);
    }

    @Post('login')
    @ApiResponse({
        type: LoginResponse
    })
    async login(@Body() body: LoginRequest) {
        return this.adminAuthService.login(body);
    }

    @Get('/me')
    @AdminAuth()
    @ApiResponse({
        type: UserResponse
    })
    async getMe(@CurrentUserId() userId: number) {
        const user = await this.adminAuthService.getMe(userId);
        return plainToInstance(UserResponse, user);
    }
}