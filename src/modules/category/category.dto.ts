import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose, Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { CategoryType } from "src/shared/enums/category";

export class CreateCategoryRequest {
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

@Expose()
export class CategoryResponse {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    icon: string;

    @ApiProperty()
    type: CategoryType;

    @ApiProperty()
    parentId: number;

    @ApiProperty()
    editable: boolean;

    constructor(partial: Partial<CategoryResponse>) {
        Object.assign(this, partial);
    }
}