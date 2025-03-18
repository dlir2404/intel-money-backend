import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class CreateRequest {
    @ApiProperty()
    name: string;

    @ApiProperty({ required: false })
    email?: string;

    @ApiProperty({ required: false })
    phone?: string;
}

@Expose()
export class RelatedUserResponse {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiProperty({ required: false })
    email?: string;

    @ApiProperty({ required: false })
    phone?: string;

    @ApiProperty()
    totalLoan: number;

    @ApiProperty()
    totalBorrow: number;

    constructor(partial: Partial<RelatedUserResponse>) {
        Object.assign(this, partial);
    }
}

@Expose()
export class CompactRelatedUserResponse {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    constructor(partial: Partial<CompactRelatedUserResponse>) {
        Object.assign(this, partial);
    }
}