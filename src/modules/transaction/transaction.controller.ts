import { Body, Controller, Post } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { TransactionService } from "./transaction.service";
import { CreateGeneralTransactionRequest, GeneralTransactionResponse } from "./transaction.dto";
import { CurrentUserId, UserAuth } from "src/shared/decorators/auth";

@Controller("transaction")
@ApiTags("Transaction")
export class TransactionController {
    constructor(private readonly transactionService: TransactionService) {}

    @Post("income/create")
    @ApiResponse({
        status: 201,
        type: GeneralTransactionResponse
    })
    @UserAuth()
    async createIncome(@Body() body: CreateGeneralTransactionRequest, @CurrentUserId() userId: number) {
        const transaction = await this.transactionService.createIncome(body, userId);
        return new GeneralTransactionResponse(transaction);
    }

    @Post("expense/create")
    @ApiResponse({
        status: 201,
        type: GeneralTransactionResponse
    })
    @UserAuth()
    async createExpense(@Body() body: CreateGeneralTransactionRequest, @CurrentUserId() userId: number) {
        const transaction = await this.transactionService.createExpense(body, userId);
        return new GeneralTransactionResponse(transaction);
    }
}