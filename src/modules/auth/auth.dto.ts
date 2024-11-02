import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class LoginRequest {
    @ApiProperty({
        type: String
    })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({
        type: String
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}

export class LoginResponse {
    @ApiProperty()
    token: string;
}

export class RegisterRequest {
    @ApiProperty({
        type: String
    })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({
        type: String
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}