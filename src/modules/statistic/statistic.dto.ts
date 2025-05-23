import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsArray } from "class-validator";
import { Transform } from "class-transformer";

export class ByCategoryData {
    @ApiProperty()
    id: number;

    @ApiProperty()
    amount: number;

    @ApiProperty({
        type: [Number],
        description: "List of transaction IDs associated with this category or this category's subcategories",
        example: [1, 2, 3]
    })
    transactionIds: number[];
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

    @ApiProperty({
        required: false,
        example: "1,2,3",
        type: String,
        description: "List of category IDs to filter by. If not provided, all categories will be included."
    })
    @IsOptional()
    @Transform(({ value }) =>
        // Nếu không có value thì trả về mảng rỗng
        (value || '').split(',').map(v => parseInt(v, 10))
    )
    @IsArray()
    @IsNumber({}, { each: true })
    categories?: number[];

    @ApiProperty({
        required: false,
        example: "1,2,3",
        type: String,
        description: "List of source wallet IDs to filter by. If not provided, all wallets will be included."
    })
    @IsOptional()
    @Transform(({ value }) =>
        // Nếu không có value thì trả về mảng rỗng
        (value || '').split(',').map(v => parseInt(v, 10))
    )
    @IsArray()
    @IsNumber({}, { each: true })
    sourceWallets?: number[];
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