import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class PaginationType {
    @ApiProperty({
        required: false,
        example: 1
    })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    page: number;

    @ApiProperty({
        required: false,
        example: 10
    })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    pageSize: number;
}

export class DateType {
    @ApiProperty({
        required: false,
        example: '2024-11-02T16:01:16.425Z'
    })
    @IsString()
    @IsOptional()
    from: string;

    @ApiProperty({
        required: false,
        example: '2024-11-02T16:01:16.425Z'
    })
    @IsString()
    @IsOptional()
    to: string;
}

export class DateAndPaginationType {
    @ApiProperty({
        required: false,
        example: 1
    })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    page: number;

    @ApiProperty({
        required: false,
        example: 10
    })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    pageSize: number;

    @ApiProperty({
        required: false,
        example: '2024-11-02T16:01:16.425Z'
    })
    @IsString()
    @IsOptional()
    from: string;

    @ApiProperty({
        required: false,
        example: '2024-11-02T16:01:16.425Z'
    })
    @IsString()
    @IsOptional()
    to: string;
}

export class BaseResponse {
    @ApiProperty()
    result: boolean

    constructor(partial: Partial<BaseResponse>) {
        Object.assign(this, partial);
    }
}