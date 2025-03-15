import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose, Type } from "class-transformer";
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

@Expose()
export class WalletResponse {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    description: string;

    @ApiProperty()
    icon: string;

    @ApiProperty()
    balance: number;

    @ApiProperty()
    userId: number;

    constructor(partial: Partial<WalletResponse>) {
        Object.assign(this, partial);
    }
}


@Expose()
export class CompactWalletResponse {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    icon: string;

    @Exclude()
    description: string;

    @Exclude()
    balance: number;

    constructor(partial: Partial<CompactWalletResponse>) {
        Object.assign(this, partial);
    }
}

@Expose()
export class WalletListResponse {
    @ApiProperty({
        type: [WalletResponse],
    })
    @Type(() => WalletResponse)
    wallets: any;

    constructor(partial: Partial<WalletListResponse>) {
        Object.assign(this, partial);
    }
}