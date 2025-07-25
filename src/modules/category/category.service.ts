import { forwardRef, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { CreateCategoryRequest, EditCategoryRequest } from "./category.dto";
import { Category } from "src/database/models";
import { Transaction } from "sequelize";
import { categories } from "./default.categories";
import { TransactionService } from "../transaction/transaction.service";

@Injectable()
export class CategoryService {
    constructor(
        @Inject(forwardRef(() => TransactionService)) private readonly transactionService: TransactionService
    ) { }

    async createDefaultCategories(userId: number, t?: Transaction) {
        try {
            for (const categoryData of categories) {
                const { children, ...parentCategory } = categoryData;

                // Create parent category
                const parent = await Category.create({
                    ...parentCategory,
                    userId
                }, { transaction: t });

                // Create children categories if they exist
                if (children && Array.isArray(children)) {
                    for (const childData of children) {
                        await Category.create({
                            ...childData,
                            userId,
                            parentId: parent.id
                        }, { transaction: t });
                    }
                }
            }
        } catch (error) {
            throw new Error(`Failed to create default categories: ${error.message}`);
        }
    }


    async findById(id: number, userId: number) {
        const category = await Category.findOne({
            where: { id, userId },
            raw: true
        });

        if (!category) {
            throw new NotFoundException("Category not found");
        }

        return category;
    }

    async create(userId: number, body: CreateCategoryRequest) {
        if (body.parentId) {
            const parentCategory = await Category.findOne({
                where: { id: body.parentId, userId }
            });

            if (!parentCategory) {
                throw new NotFoundException("Parent category not found");
            }
        }

        const res = await Category.create({
            ...body,
            userId: userId,
        });

        return res.dataValues;
    }

    async update(id: number, userId: number, body: EditCategoryRequest) {
        const category = await Category.findOne({
            where: { id, userId }
        })

        if (!category) {
            throw new NotFoundException("Category not found");
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

        await this.transactionService.removeTransactionByCategoryId(userId, id, async (t: Transaction) => {
            await category.destroy({ transaction: t });
        });

        return { result: true };
    }

    async getAll(userId: number) {
        return await Category.findAll({
            where: { userId },
            raw: true,
        });
    }


    async getAllToJson(userId: number) {
        const categories = await this.getAll(userId);

        const categoryTree: Record<string, any> = {};

        categories.forEach((category) => {
            if (!category.parentId) {
                categoryTree[category.id] = { ...category, children: [] };
            } else {
                if (categoryTree[category.parentId]) {
                    categoryTree[category.parentId].children.push(category);
                }
            }
        });

        return JSON.stringify(Object.values(categoryTree).map((category) => {
            return {
                id: category.id,
                name: category.name,
                children: category.children.map((child) => ({
                    id: child.id,
                    name: child.name,
                })),
            };
        }));
    }

    async findOtherIncomeCategory(userId: number) {
        const category = await Category.findOne({
            where: {
                userId,
                type: "INCOME",
                name: "Khác"
            },
            raw: true
        });

        if (!category) {
            throw new NotFoundException("Other Income category not found");
        }

        return category;
    }

    async findOtherExpenseCategory(userId: number) {
        const category = await Category.findOne({
            where: {
                userId,
                type: "EXPENSE",
                name: "Khác"
            },
            raw: true
        });

        if (!category) {
            throw new NotFoundException("Other Expense category not found");
        }

        return category;
    }

    async reset(userId: number, t: Transaction) {
        await Category.destroy({
            where: { userId },
            transaction: t
        });
        await this.createDefaultCategories(userId, t);
    }
}