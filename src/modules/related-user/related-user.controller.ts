import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { RelatedUserService } from "./related-user.service";
import { CurrentUserId, UserAuth } from "src/shared/decorators/auth";
import { CreateRequest, RelatedUserResponse } from "./related-user.dto";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/types/base";

@Controller("related-user")
@ApiTags("Related User")
export class RelatedUserController {
    constructor(private readonly reUserService: RelatedUserService) {}

    @Post()
    @ApiResponse({
        status: 201,
        type: RelatedUserResponse
    })
    @UserAuth()
    async create(@CurrentUserId() userId: number, @Body() body: CreateRequest) {
        return new RelatedUserResponse(await this.reUserService.create(body, userId));
    }

    @Put("/:id")
    @ApiResponse({
        status: 200,
        type: BaseResponse
    })
    @UserAuth()
    async update(@CurrentUserId() ownerId: number, @Body() body: CreateRequest, @Param("id") id: number) {
        await this.reUserService.update(id, body, ownerId);
        return new BaseResponse({ result: true });
    }

    @Delete("/:id")
    @ApiResponse({
        status: 200,
        type: BaseResponse
    })
    @UserAuth()
    async delete(@CurrentUserId() ownerId: number, @Param("id") id: number) {
        await this.reUserService.delete(id, ownerId);
        return new BaseResponse({ result: true });
    }

    @Get()
    @ApiResponse({
        status: 200,
        type: [RelatedUserResponse]
    })
    @UserAuth()
    async getAll(@CurrentUserId() userId: number) {
        return await this.reUserService.getAll(userId);
    }
}