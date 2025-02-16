import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateRequest {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty({
        required: false
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty()
    @IsString()
    icon: string;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    balance?: number;
}