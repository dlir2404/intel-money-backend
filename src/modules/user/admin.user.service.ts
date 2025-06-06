import { Injectable, NotFoundException } from "@nestjs/common";
import { GetListUsersRequest } from "./user.dto";
import { User } from "src/database/models";
import { Op, WhereOptions } from "sequelize";

@Injectable()
export class AdminUserService {
    constructor() { }

    async getListUsers(params: GetListUsersRequest) {
        const where: WhereOptions<User> = {}

        if (params.role) {
            where.role = params.role
        }

        if (params.search) {
            where[Op.or] = [
                {
                    name: {
                        [Op.like]: `%${params.search}%`
                    }
                },
                {
                    email: {
                        [Op.like]: `%${params.search}%`
                    }
                }
            ]
        }

        if (params.isVip != undefined) {
            where.isVip = params.isVip ? 1 : 0
        }

        if (params.from && params.to) {
            where.createdAt = {
                [Op.between]: [new Date(params.from), new Date(params.to)]
            };
        } else if (params.from) {
            where.createdAt = {
                [Op.gte]: new Date(params.from)
            };
        } else if (params.to) {
            where.createdAt = {
                [Op.lte]: new Date(params.to)
            };
        }

        const { rows, count } = await User.findAndCountAll({
            where: where,
            limit: params.pageSize || 10,
            offset: ((params.page - 1 || 0) * (params.pageSize || 10)),
            raw: true
        })

        return {
            count,
            rows
        }
    }

    async setVip(id: number, vipExpirationDate: string) {
        const user = await User.findByPk(id);

        if (!user) {
            throw new NotFoundException("User not found");
        }

        user.isVip = true;
        user.vipExpirationDate = vipExpirationDate;

        await user.save();

        return user.dataValues;
    }

    async disableVip(userId: number) {
        const user = await User.findByPk(userId);

        if (!user) {
            throw new NotFoundException("User not found");
        }

        user.isVip = false;
        user.vipExpirationDate = null;

        await user.save();
    }
}