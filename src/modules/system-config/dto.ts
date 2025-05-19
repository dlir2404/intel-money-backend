import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateSystemConfigDto {
    @ApiProperty({
        required: true,
        example: 'config_key'
    })
    @IsString()
    @IsNotEmpty()
    key: string;

    @ApiProperty({
        required: true,
        example: 'config_value'
    })
    @IsString()
    @IsNotEmpty()
    value: string;
}

export class UpdateSystemConfigDto {
    @ApiProperty({
        required: true,
        example: 'config_value'
    })
    @IsString()
    @IsNotEmpty()
    value: string;
}

export class SystemConfigResponse {
    @ApiProperty()
    id: number;

    @ApiProperty({
        required: true,
        example: 'config_key'
    })
    key: string;

    @ApiProperty({
        required: true,
        example: 'config_value'
    })
    value: string;

    @ApiProperty({
        required: true,
        example: '2024-11-02T16:01:16.425Z'
    })
    createdAt: string;

    @ApiProperty({
        required: true,
        example: '2024-11-02T16:01:16.425Z'
    })
    updatedAt: string;
}