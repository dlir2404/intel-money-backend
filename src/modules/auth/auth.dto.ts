import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, IsTimeZone } from "class-validator";

export class LoginRequest {
    @ApiProperty({
        type: String,
        example: 'example@gmail.com'
    })
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        type: String,
        example: '123456'
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}

export class GoogleLoginRequest {
    @ApiProperty({
        type: String,
        example: 'aaaaaaaaaa'
    })
    @IsString()
    @IsNotEmpty()
    idToken: string

    @ApiProperty({
        type: String,
        required: false,
        example: 'Asia/Saigon'
    })
    @IsString()
    @IsTimeZone()
    timezone?: string;
}

export class LoginResponse {
    @ApiProperty()
    accessToken: string;

    @ApiProperty()
    refreshToken: string;
}

export class RegisterRequest {
    @ApiProperty({
        type: String,
        example: 'Dinh Linh',
    })
    @IsString()
    name: string;
    
    @ApiProperty({
        type: String,
        required: true,
        example: 'example@gmail.com'
    })
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        type: String,
        required: true,
        example: '123456'
    })
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiProperty({
        type: String,
        required: false,
        example: 'Asia/Saigon'
    })
    @IsString()
    @IsTimeZone()
    timezone?: string;
}

export class RefreshTokenRequest {
    @ApiProperty({
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}


export class ForgotPasswordRequest {
    @ApiProperty({
        type: String,
        example: 'example@gmail.com'
    })
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;
}

export class ForgotPasswordResponse {
    @ApiProperty()
    message: string;
}

export class VerifyOtpRequest {
    @ApiProperty({
        type: String,
        example: 'example@gmail.com'
    })
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        type: String,
        example: '123456'
    })
    @IsString()
    @IsNotEmpty()
    otp: string;
}

export class VerifyOtpResponse {
    @ApiProperty({
        type: String,
        example: '123456-abcdef'
    })
    @IsString()
    @IsNotEmpty()
    resetToken: string;
}

export class ResetPasswordRequest {
    @ApiProperty({
        type: String,
        example: 'example@gmail.com'
    })
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        type: String,
        example: '123456-abcdef'
    })
    @IsString()
    @IsNotEmpty()
    resetToken: string;

    @ApiProperty({
        type: String,
        example: '123456'
    })
    @IsString()
    @IsNotEmpty()
    newPassword: string;
}

export class ResetPasswordResponse {
    @ApiProperty({
        type: String,
        example: 'Password reset successfully'
    })
    @IsString()
    @IsNotEmpty()
    message: string;
}