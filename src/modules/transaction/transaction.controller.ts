import {Body, Controller, Delete, Get, InternalServerErrorException, Param, Post, Query} from "@nestjs/common";
import { ApiOperation, ApiProperty, ApiResponse, ApiTags } from "@nestjs/swagger";
import { TransactionService } from "./transaction.service";
import { BorrowTransactionResponse, CreateBorrowTransactionRequest, CreateBulkIncomeTransactionRequest, CreateGeneralTransactionRequest, CreateLendTransactionRequest, CreateTransferTransactionRequest, GeneralTransactionResponse, GetAllTransactionsRequest, LendTransactionResponse, TransferTransactionResponse } from "./transaction.dto";
import { CurrentUserId, UserAuth } from "src/shared/decorators/auth";
import { BaseResponse } from "src/shared/types/base";

@Controller("transaction")
@ApiTags("Transaction")
export class TransactionController {
    constructor(private readonly transactionService: TransactionService) {}

    @Get("all")
    @UserAuth()
    @ApiResponse({
        status: 200,
        type: GeneralTransactionResponse,
        isArray: true
    })
    @ApiOperation({
        summary: "Get all transactions, in the compact format, not include extra info",
    })
    async getAllTransactions(@CurrentUserId() userId: number, @Query() query: GetAllTransactionsRequest) {
        const transactions = await this.transactionService.getAllTransactions(userId, query);
        return transactions;
    }

    @Get("all/test-only")
    @UserAuth()
    @ApiResponse({
        status: 200,
        type: GeneralTransactionResponse,
        isArray: true
    })
    @ApiOperation({
        summary: "Get all transactions in all time, just for test only",
    })
    async getAllTransactionsTestOnly(@CurrentUserId() userId: number) {
        const transactions = await this.transactionService.getAllTransactionsTestOnly(userId);
        return transactions;
    }

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

    @Post("lend/create")
    @ApiResponse({
        status: 201,
        type: LendTransactionResponse
    })
    @UserAuth()
    async createLend(@Body() body: CreateLendTransactionRequest, @CurrentUserId() userId: number) {
        const transaction = await this.transactionService.createLend(body, userId);
        return new LendTransactionResponse(transaction);
    }

    @Post("borrow/create")
    @ApiResponse({
        status: 201,
        type: BorrowTransactionResponse
    })
    @UserAuth()
    async createBorrow(@Body() body: CreateBorrowTransactionRequest, @CurrentUserId() userId: number) {
        const transaction = await this.transactionService.createBorrow(body, userId);
        return new BorrowTransactionResponse(transaction);
    }

    @Delete(":id")
    @ApiResponse({
        status: 200,
        type: BaseResponse
    })
    @ApiOperation({
        summary: "Delete transaction",
    })
    @UserAuth()
    async deleteTransaction(@Param("id") id: number) {
        await this.transactionService.removeTransaction(id);

        return new BaseResponse({result: true});
    }
}