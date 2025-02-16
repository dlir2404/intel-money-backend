import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateRequest } from "./category.dto";
import { Category } from "src/database/models";

@Injectable()
export class CategoryService {
    async create(userId: number, body: CreateRequest) {
        if (body.parentId) {
            const parentCategory = await Category.findOne({
                where: { id: body.parentId, userId }
            });

            if (!parentCategory) {
                throw new NotFoundException("Parent category not found");
            }
        }

        return await Category.create({
            ...body,
            userId: userId,
        });
    }

    async update(id: number, userId: number, body: CreateRequest) {
        const category = await Category.findOne({
            where: { id, userId }
        })
        
        if (!category) {
            throw new NotFoundException("Category not found");
        }

        if (body.parentId) {
            const parentCategory = await Category.findOne({
                where: { id: body.parentId, userId }
            });

            if (!parentCategory) {
                throw new NotFoundException("Parent category not found");
            }
        }

        return await category.update(body);
    }

    async delete(id: number, userId: number) {
        const category = await Category.findOne({
            where: { id, userId }
        })
        if (!category) {
            throw new NotFoundException("Category not found");
        }

        return await category.destroy();
    }

    async getRecursively(userId: number) {
        return await Category.findAll({
            where: { 
                userId,
                parentId: null
            },
            include: [
                {
                    model: Category,
                    as: 'children',
                }
            ]
        });
    }
}