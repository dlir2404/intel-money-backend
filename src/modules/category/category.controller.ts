import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CategoryService } from "./category.service";
import { CurrentUserId, UserAuth } from "src/shared/decorators/auth";
import { CreateRequest } from "./category.dto";

@Controller("category")
@ApiTags("Category")
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    @Post()
    @UserAuth()
    async create(@CurrentUserId() userId: number, @Body() body: CreateRequest) {
        return await this.categoryService.create(userId, body);
    }

    @Put(":id")
    @UserAuth()
    async update(@CurrentUserId() userId: number, @Body() body: CreateRequest, @Param("id") id: number) {
        return await this.categoryService.update(id, userId, body);
    }

    @Delete(":id")
    @UserAuth()
    async delete(@CurrentUserId() userId: number, @Param("id") id: number) {
        return await this.categoryService.delete(id, userId);
    }

    @Get()
    @UserAuth()
    async getRecursively(@CurrentUserId() userId: number) {
        return await this.categoryService.getRecursively(userId);
    }
}