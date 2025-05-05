import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose, Type } from "class-transformer";
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";
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