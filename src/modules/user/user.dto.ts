import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose, Type } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { UserRole } from "src/shared/enums/user";
import { DateAndPaginationType } from "src/shared/types/base";

export class CreateUserRequest {
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
    username: string;

    @ApiProperty()
    role: UserRole;

    @ApiProperty()
    createdAt: string;

    @ApiProperty()
    updatedAt: UserRole;

    @Exclude()
    password: string
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