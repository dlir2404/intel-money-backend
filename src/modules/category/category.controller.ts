import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { CategoryService } from "./category.service";
import { CurrentUserId, UserAuth } from "src/shared/decorators/auth";
import { CategoryResponse, CreateCategoryRequest } from "./category.dto";
import { BaseResponse } from "src/shared/types/base";

@Controller("category")
@ApiTags("Category")
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    @Post()
    @ApiResponse({
        status: 201,
        type: CategoryResponse
    })
    @UserAuth()
    async create(@CurrentUserId() userId: number, @Body() body: CreateCategoryRequest) {
        return new CategoryResponse(await this.categoryService.create(userId, body));
    }

    @Put(":id")
    @UserAuth()
    @ApiResponse({
        status: 200,
        type: CategoryResponse
    })
    async update(@CurrentUserId() userId: number, @Body() body: CreateCategoryRequest, @Param("id") id: number) {
        const response = await this.categoryService.update(id, userId, body);
        return new CategoryResponse(response.dataValues);
    }

    @Delete(":id")
    @ApiResponse({
        status: 200,
        type: BaseResponse
    })
    @UserAuth()
    async delete(@CurrentUserId() userId: number, @Param("id") id: number) {
        await this.categoryService.delete(id, userId);
        return new BaseResponse({ result: true });
    }

    @Get()
    @ApiResponse({
        status: 200,
        type: [CategoryResponse]
    })
    @UserAuth()
    async getRecursively(@CurrentUserId() userId: number) {
        const response = await this.categoryService.getAll(userId);
        return response;
    }
}