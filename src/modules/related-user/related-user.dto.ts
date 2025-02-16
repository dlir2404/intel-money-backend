import { ApiProperty } from "@nestjs/swagger";

export class CreateRequest {
    @ApiProperty()
    name: string;

    @ApiProperty({ required: false })
    email?: string;

    @ApiProperty({ required: false })
    phone?: string;
}