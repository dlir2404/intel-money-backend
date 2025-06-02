import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose, Type } from "class-transformer";
import { IsBoolean, IsDefined, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, IsTimeZone, IsUrl } from "class-validator";
import { UserRole } from "src/shared/enums/user";
import { DateAndPaginationType } from "src/shared/types/base";

export class CreateUserRequest {
    @ApiProperty({
        type: String
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        type: String
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        type: String
    })
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiProperty({
        type: String
    })
    @IsString()
    phone?: string;

    @ApiProperty({
        enum: UserRole
    })
    @IsString()
    @IsNotEmpty()
    role: UserRole
}

@Expose()
export class UserResponse {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    email: string;

    @Exclude()
    password: string;

    @ApiProperty()
    picture?: string;

    @ApiProperty()
    phone: string;

    @ApiProperty()
    isVip: boolean;

    @ApiProperty()
    vipExpirationDate: string;

    @ApiProperty()
    totalBalance: number;

    @ApiProperty()
    totalLoan: number;

    @ApiProperty()
    totalDebt: number;

    @Exclude()
    role: UserRole;

    @Exclude()
    createdAt: string;

    @Exclude()
    updatedAt: string;

    constructor(partial: Partial<UserResponse>) {
        Object.assign(this, partial);
    }
}

export class GetListUsersRequest extends DateAndPaginationType {
    @ApiProperty({
        enum: UserRole,
        required: false
    })
    @IsString()
    @IsOptional()
    role: UserRole

    @ApiProperty({
        required: false
    })
    @IsString()
    @IsOptional()
    search: string;

    @ApiProperty({
        required: false
    })
    @Type(() => Boolean)
    @IsBoolean()
    @IsOptional()
    isVip: boolean
}

@Expose()
export class ListUserResponse {
    @ApiProperty()
    count: number;

    @ApiProperty({
        type: UserResponse,
        isArray: true
    })
    @Type(() => UserResponse)
    rows: UserResponse[]
}


export class ChangeAvatarRequest {
    @ApiProperty({
        type: String
    })
    @IsNotEmpty()
    @IsUrl()
    url: string;
}

export class ChangeTimezoneRequest {
    @ApiProperty({
        type: String
    })
    @IsNotEmpty()
    @IsTimeZone()
    timezone: string;
}

export class ChangeCurrencyRequest {
    @ApiProperty({
        type: String,
        description: "Currency code"
    })
    @IsString()
    @IsNotEmpty()
    currency: string;
}

export class SetVipRequest {
    @ApiProperty({
        type: String
    })
    @IsNotEmpty()
    @IsString()
    vipExpirationDate: string;
}

export class DisableVipRequest {
    @ApiProperty({
        type: Number
    })
    @IsDefined()
    @IsNumber()
    userId: number;
}