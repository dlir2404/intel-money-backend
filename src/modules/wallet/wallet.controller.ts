import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { WalletService } from "./wallet.service";
import { CurrentUserId, UserAuth } from "src/shared/decorators/auth";
import { CreateRequest, WalletListResponse, WalletResponse } from "./wallet.dto";
import { BaseResponse } from "src/shared/types/base";

@Controller("wallet")
@ApiTags("Wallet")
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Post()
    @ApiResponse({
        status: 201,
        type: WalletResponse
    })
    @UserAuth()
    async create(@Body() body: CreateRequest, @CurrentUserId() userId: number) {
        const response = await this.walletService.create(body, userId);
        return new WalletResponse(response);
    }

    @Put(":id")
    @ApiResponse({
        status: 200,
        type: WalletResponse
    })
    @UserAuth()
    async update(@Body() body: CreateRequest, @CurrentUserId() userId: number, @Param("id") id: number) {
        const response = await this.walletService.update(id, userId, body);
        return new WalletResponse(response);
    }

    @Delete(":id")
    @ApiResponse({
        status: 200,
        type: BaseResponse
    })
    @UserAuth()
    async delete(@Param("id") id: number, @CurrentUserId() userId: number) {
        await this.walletService.delete(id, userId);
        return new BaseResponse({result: true});
    }

    @Get()
    @ApiResponse({
        status: 200,
        type: WalletListResponse
    })
    @UserAuth()
    async findAll(@CurrentUserId() userId: number) {
        const response = await this.walletService.findAll(userId);
        return new WalletListResponse({wallets: response});
    }
}