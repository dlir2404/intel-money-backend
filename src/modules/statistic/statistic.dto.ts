import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ByCategoryData {
    @ApiProperty()
    id: number;

    @ApiProperty()
    amount: number;
}

export class StatisticData {
    @ApiProperty()
    totalIncome: number;

    @ApiProperty()
    totalExpense: number;

    @ApiProperty()
    totalBalance: number;

    @ApiProperty({
        type: ByCategoryData,
        description: "Income by category (only for 1's level categories)",
    })
    byCategoryIncome: ByCategoryData[];

    @ApiProperty({
        type: ByCategoryData,
        description: "Expense by category (only for 1's level categories)",
    })
    byCategoryExpense: ByCategoryData[];
}

export class CompactStatisticData {
    @ApiProperty()
    totalIncome: number;

    @ApiProperty()
    totalExpense: number;

    @ApiProperty()
    totalBalance: number;
}


export class StatisticDataByDayRequest {
    @ApiProperty({
        required: true,
        example: '2024-11-02T16:01:16.425Z'
    })
    @IsString()
    @IsNotEmpty()
    from: string;

    @ApiProperty({
        required: true,
        example: '2024-11-02T16:01:16.425Z'
    })
    @IsString()
    @IsNotEmpty()
    to: string;
}

export class CustomRangeStatisticRequest {
    @ApiProperty({
        required: true,
        example: '2024-11-02T16:01:16.425Z'
    })
    @IsString()
    @IsNotEmpty()
    from: string;

    @ApiProperty({
        required: true,
        example: '2024-11-02T16:01:16.425Z'
    })
    @IsString()
    @IsNotEmpty()
    to: string;
}