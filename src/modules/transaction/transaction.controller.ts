import { Body, Controller, Post } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { TransactionService } from "./transaction.service";
import { CreateGeneralTransactionRequest, CreateTransferTransactionRequest, GeneralTransactionResponse, TransferTransactionResponse } from "./transaction.dto";
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

    @Post("transfer/create")
    @ApiResponse({
        status: 201,
        type: TransferTransactionResponse
    })
    @UserAuth()
    async createTransfer(@Body() body: CreateTransferTransactionRequest, @CurrentUserId() userId: number) {
        const transaction = await this.transactionService.createTransfer(body, userId);
        return new TransferTransactionResponse(transaction);
    }
}