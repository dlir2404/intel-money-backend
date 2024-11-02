import { Injectable } from "@nestjs/common";
import { GetListUsersRequest } from "./user.dto";
import { User } from "src/database/models";
import { Op, WhereOptions } from "sequelize";

@Injectable()
export class AdminUserService {
    constructor() {}

    async getListUsers(params: GetListUsersRequest) {
        const where: WhereOptions<User> = {}

        if (params.role) {
            where.role = params.role
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
}