import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { CategoryType } from "src/shared/enums/category";

export class CreateRequest {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    icon?: string;

    @ApiProperty({
        enum: CategoryType,
        required: true
    })
    @IsEnum(CategoryType)
    type: CategoryType;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    parentId?: number;
}