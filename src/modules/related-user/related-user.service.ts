import { Injectable, NotFoundException } from "@nestjs/common";
import { RelatedUser } from "src/database/models";
import { CreateRequest } from "./related-user.dto";

@Injectable()
export class RelatedUserService {
    async create(body: CreateRequest, userId: number) {
        return await RelatedUser.create({
            ...body,
            userId
        });
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
                userId
            }
        });
    }
}