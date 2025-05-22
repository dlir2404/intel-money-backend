import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import {
    ForgotPasswordRequest,
    GoogleLoginRequest,
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RegisterRequest, ResetPasswordRequest, VerifyOtpRequest
} from './auth.dto';
import { AuthService } from './auth.service';
import { CurrentUserId, UserAuth } from 'src/shared/decorators/auth';
import { UserResponse } from '../user/user.dto';
import { GoogleAuthService } from './auth.google.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly googleAuthService: GoogleAuthService
    ) { };

    @Post('register')
    @ApiResponse({
        type: LoginResponse
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

    @Post('google')
    async googleLogin(@Body() body: GoogleLoginRequest) {
        return this.googleAuthService.login(body);
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
    async getMe(@CurrentUserId() userId: number): Promise<UserResponse> {
        const user = await this.authService.getMe(userId);
        return new UserResponse(user);
    }

    @Post('forgot-password')
    @ApiResponse({
        type: String
    })
    async forgotPassword(@Body() body: ForgotPasswordRequest) {
        return this.authService.forgotPassword(body.email);
    }

    @Post('verify-otp')
    async verifyOtp(@Body() body: VerifyOtpRequest) {
        return this.authService.verifyOtp(body.email, body.otp);
    }

    @Post('reset-password')
    async resetPassword(@Body() body: ResetPasswordRequest) {
        return this.authService.resetPassword(body.email, body.resetToken, body.newPassword);
    }
}
