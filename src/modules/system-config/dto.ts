import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsDefined, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

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

export class UpdateAdsConfigDto {
    @ApiProperty({
        required: true,
        example: 0.5
    })
    @IsDefined()
    @IsNumber()
    @Min(0)
    @Max(1)
    adProbability: number;

    @ApiProperty({
        required: true,
        example: 30,
        description: 'in seconds'
    })
    @IsDefined()
    @IsNumber()
    @Min(0)
    @Max(3600)
    minTimeBetweenAds: number;
}

export class UpdateSystemConfigDto {
    @ApiProperty({
        required: false,
        type: UpdateAdsConfigDto,
    })
    @IsOptional()
    adsConfig?: UpdateAdsConfigDto;
}

export class AdsConfigResponse {
    @ApiProperty({
        required: true,
        example: 0.5
    })
    adProbability: number;

    @ApiProperty({
        required: true,
        example: 30,
        description: 'in seconds'
    })
    minTimeBetweenAds: number;
}


export class SystemConfigResponse {
    @ApiProperty()
    id: number;

    @ApiProperty({
        required: true,
        type: AdsConfigResponse,
        example: {
            adProbability: 0.5,
            minTimeBetweenAds: 30
        }
    })
    adsConfig: AdsConfigResponse;

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