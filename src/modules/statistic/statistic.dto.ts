import { ApiProperty } from "@nestjs/swagger";

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