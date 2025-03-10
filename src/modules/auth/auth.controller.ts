import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginRequest, LoginResponse, RefreshTokenRequest, RegisterRequest } from './auth.dto';
import { AuthService } from './auth.service';
import { CurrentUserId, UserAuth } from 'src/shared/decorators/auth';
import { plainToInstance } from 'class-transformer';
import { UserResponse } from '../user/user.dto';
import { BaseResponse } from 'src/shared/types/base';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {};
    @Post('register')
    @ApiResponse({
        type: BaseResponse
    })
    async register(@Body() body: RegisterRequest) {
        return this.authService.register(body);
    }

    @Post('login')
    @ApiResponse({
        type: LoginResponse
    })
    async login(@Body() body: LoginRequest) {
        return this.authService.login(body);
    }

    @Post('refresh-token')
    @ApiResponse({
        type: LoginResponse
    })
    async refreshToken(@Body() body: RefreshTokenRequest) {
        return this.authService.refreshToken(body.refreshToken);
    }
    
    @Get('me')
    @UserAuth()
    @ApiResponse({
        type: UserResponse
    })
    async getMe(@CurrentUserId() userId: number): Promise<UserResponse>{
        const user = await this.authService.getMe(userId);
        return plainToInstance(UserResponse, user);
    }
}
