import {Body, Controller, Delete, Get, InternalServerErrorException, Param, Post, Put, Query} from "@nestjs/common";
import { ApiOperation, ApiProperty, ApiResponse, ApiTags } from "@nestjs/swagger";
import { TransactionService } from "./transaction.service";
import {
    BorrowTransactionResponse,
    CreateBorrowTransactionRequest,
    CreateBulkIncomeTransactionRequest,
    CreateGeneralTransactionRequest,
    CreateLendTransactionRequest,
    CreateModifyBalanceTransactionRequest,
    CreateTransferTransactionRequest,
    FullInfoTransactionResponse,
    GeneralTransactionResponse,
    GetAllTransactionsRequest,
    LendTransactionResponse,
    ModifyBalanceTransactionResponse,
    TransferTransactionResponse, UpdateBorrowTransactionRequest, UpdateExpenseTransactionRequest,
    UpdateIncomeTransactionRequest, UpdateLendTransactionRequest,
    UpdateTransferTransactionRequest
} from "./transaction.dto";
import { CurrentUserId, UserAuth } from "src/shared/decorators/auth";
import { BaseResponse } from "src/shared/types/base";

@Controller("transaction")
@ApiTags("Transaction")
export class TransactionController {
    constructor(private readonly transactionService: TransactionService) {}

    @Get("time-range")
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
        const transactions = await this.transactionService.getTransactions(userId, query);
        return transactions;
    }

    @Get("all")
    @UserAuth()
    @ApiResponse({
        status: 200,
        type: GeneralTransactionResponse,
        isArray: true
    })
    @ApiOperation({
        summary: "Get all transactions in all time",
    })
    async getAllTransactionsTestOnly(@CurrentUserId() userId: number) {
        const transactions = await this.transactionService.getAllTransactions(userId);
        return transactions;
    }

    @Get(":id")
    @UserAuth()
    @ApiResponse({
        status: 200,
        type: FullInfoTransactionResponse
    })
    @ApiOperation({
        summary: "Get full data transaction by id",
    })
    async getTransactionById(@Param("id") id: number, @CurrentUserId() userId: number) {
        const transaction = await this.transactionService.getTransactionById(userId, id);
        return transaction;
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

    @Put("income/update/:id")
    @ApiResponse({
        status: 200,
        type: GeneralTransactionResponse
    })
    @UserAuth()
    async updateIncome(@Param("id") id: number, @Body() body: UpdateIncomeTransactionRequest, @CurrentUserId() userId: number) {
        const transaction = await this.transactionService.updateIncome(id, body, userId);
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

    @Put("expense/update/:id")
    @ApiResponse({
        status: 200,
        type: GeneralTransactionResponse
    })
    @UserAuth()
    async updateExpense(@Param("id") id: number, @Body() body: UpdateExpenseTransactionRequest, @CurrentUserId() userId: number) {
        const transaction = await this.transactionService.updateExpense(id, body, userId);
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

    @Put("transfer/update/:id")
    @ApiResponse({
        status: 200,
        type: TransferTransactionResponse
    })
    @UserAuth()
    async updateTransfer(@Param("id") id: number, @Body() body: UpdateTransferTransactionRequest, @CurrentUserId() userId: number) {
        const transaction = await this.transactionService.updateTransfer(id, body, userId);
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

    @Put("lend/update/:id")
    @ApiResponse({
        status: 200,
        type: LendTransactionResponse
    })
    @UserAuth()
    async updateLend(@Param("id") id: number, @Body() body: UpdateLendTransactionRequest, @CurrentUserId() userId: number) {
        const transaction = await this.transactionService.updateLend(id, body, userId);
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

    @Put("borrow/update/:id")
    @ApiResponse({
        status: 200,
        type: BorrowTransactionResponse
    })
    @UserAuth()
    async updateBorrow(@Param("id") id: number, @Body() body: UpdateBorrowTransactionRequest, @CurrentUserId() userId: number) {
        const transaction = await this.transactionService.updateBorrow(id, body, userId);
        return new BorrowTransactionResponse(transaction);
    }

    @Post("modify-balance/create")
    @ApiResponse({
        status: 201,
        type: ModifyBalanceTransactionResponse
    })
    @UserAuth()
    async createModifyBalance(@Body() body: CreateModifyBalanceTransactionRequest, @CurrentUserId() userId: number) {
        const transaction = await this.transactionService.createModifyBalance(body, userId);
        return new ModifyBalanceTransactionResponse(transaction);
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
    async deleteTransaction(@Param("id") id: number, @CurrentUserId() userId: number) {
        await this.transactionService.removeTransaction(userId, id);

        return new BaseResponse({result: true});
    }
}