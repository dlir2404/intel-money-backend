import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { WalletService } from "./wallet.service";
import { CurrentUserId, UserAuth } from "src/shared/decorators/auth";
import { CreateRequest } from "./wallet.dto";

@Controller("wallet")
@ApiTags("Wallet")
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Post()
    @UserAuth()
    async create(@Body() body: CreateRequest, @CurrentUserId() userId: number) {
        return await this.walletService.create(body, userId);
    }

    @Put(":id")
    @UserAuth()
    async update(@Body() body: CreateRequest, @CurrentUserId() userId: number, @Param("id") id: number) {
        return await this.walletService.update(id, userId, body);
    }

    @Delete(":id")
    @UserAuth()
    async delete(@Param("id") id: number, @CurrentUserId() userId: number) {
        return await this.walletService.delete(id, userId);
    }

    @Get()
    @UserAuth()
    async findAll(@CurrentUserId() userId: number) {
        return await this.walletService.findAll(userId);
    }
}