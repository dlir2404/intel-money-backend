import { Injectable, NotFoundException } from "@nestjs/common";
import { RelatedUser } from "src/database/models";
import { CreateRequest } from "./related-user.dto";
import { Transaction } from "sequelize";

@Injectable()
export class RelatedUserService {
    async findById(id: number, userId: number) {
        const relatedUser = await RelatedUser.findOne({
            where: {
                id,
                userId
            },
            raw: true
        });

        if (!relatedUser) {
            throw new NotFoundException("Related user not found");
        }

        return relatedUser;
    }

    async create(body: CreateRequest, userId: number) {
        const rUser = await RelatedUser.create({
            ...body,
            userId
        });

        return rUser.dataValues;
    }

    async update(id: number, body: CreateRequest, ownerId: number) {
        const relatedUser = await RelatedUser.findOne({
            where: {
                id,
                userId: ownerId
            }
        });

        if (!relatedUser) {
            throw new NotFoundException("Related user not found");
        }

        return await relatedUser.update(body);
    }

    async delete(id: number, ownerId: number) {
        const relatedUser = await RelatedUser.findOne({
            where: {
                id,
                userId: ownerId
            }
        });

        if (!relatedUser) {
            throw new NotFoundException("Related user not found");
        }

        return await relatedUser.destroy();
    }

    async getAll(userId: number) {
        return await RelatedUser.findAll({
            where: {
                userId: userId
            },
            raw: true
        });
    }

    async increaseTotalDebt(id: number, amount: number, t: Transaction) {
        return await RelatedUser.increment("totalDebt", {
            by: amount,
            where: {
                id,
            }
        });
    }

    async decreaseTotalDebt(id: number, amount: number, t: Transaction) {
        return await RelatedUser.decrement("totalDebt", {
            by: amount,
            where: {
                id,
            }
        });
    }

    async increaseTotalLoan(id: number, amount: number, t: Transaction) {
        return await RelatedUser.increment("totalLoan", {
            by: amount,
            where: {
                id,
            }
        });
    }

    async decreaseTotalLoan(id: number, amount: number, t: Transaction) {
        return await RelatedUser.decrement("totalLoan", {
            by: amount,
            where: {
                id,
            }
        });
    }
}