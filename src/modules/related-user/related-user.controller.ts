import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { RelatedUserService } from "./related-user.service";
import { CurrentUserId, UserAuth } from "src/shared/decorators/auth";
import { CreateRequest } from "./related-user.dto";
import { ApiTags } from "@nestjs/swagger";

@Controller("related-user")
@ApiTags("Related User")
export class RelatedUserController {
    constructor(private readonly reUserService: RelatedUserService) {}

    @Post()
    @UserAuth()
    async create(@CurrentUserId() userId: number, @Body() body: CreateRequest) {
        return await this.reUserService.create(body, userId);
    }

    @Put("/:id")
    @UserAuth()
    async update(@CurrentUserId() ownerId: number, @Body() body: CreateRequest, @Param("id") id: number) {
        return await this.reUserService.update(id, body, ownerId);
    }

    @Delete("/:id")
    @UserAuth()
    async delete(@CurrentUserId() ownerId: number, @Param("id") id: number) {
        return await this.reUserService.delete(id, ownerId);
    }

    @Get()
    @UserAuth()
    async getAll(@CurrentUserId() userId: number) {
        return await this.reUserService.getAll(userId);
    }
}