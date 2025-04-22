import { Injectable, UnauthorizedException } from "@nestjs/common";
import { StatisticType } from "./type/type";
import * as dayjs from 'dayjs';
import { AppCacheService } from "../cache/cache.service";
import { Category, GeneralTransaction, User } from "src/database/models";
import { Op } from "sequelize";
import { TransactionType } from "src/shared/enums/transaction";



@Injectable()
export class StatisticService {
    constructor(private readonly cacheService: AppCacheService) { }

    // stats:{userId}:{range}:{timeRange}
    // stats:123:month:2025-04
    private generateKey(userId: number, type: StatisticType, timeRange: string) {
        return `stats:${userId}:${type}:${timeRange}`;
    }

    async get(userId: number, type: StatisticType, timeRange: string) {
        const key = this.generateKey(userId, type, timeRange);
        return await this.cacheService.get(key);
    }


    async set(userId: number, type: StatisticType, timeRange: string, data: any, ttlSeconds = 3600) {
        const key = this.generateKey(userId, type, timeRange);
        await this.cacheService.set(key, data, ttlSeconds);
    }


    async getTodayStatistic(userId: number) {
        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const today = dayjs().format('YYYY-MM-DD');
        const cacheKey = this.generateKey(userId, 'daily', today);

        const cachedData = await this.cacheService.get(cacheKey);
        if (cachedData) {
            console.log(">>>> lay duoc cache roi ne. key: ", cacheKey);
            return cachedData;
        }

        const transactions = await GeneralTransaction.findAll(
            {
                where: {
                    userId,
                    // transactionDate: {
                        // [Op.gte]: dayjs().startOf('day').toDate(),
                        // [Op.lte]: dayjs().endOf('day').toDate(),
                    // },
                },
                include: [
                    {
                        model: Category,
                        attributes: ['id', 'name', 'parentId'],
                    }
                ],
                nest: true,
                raw: true,
            }
        )

        const statisticData = {
            totalIncome: 0,
            totalExpense: 0,
            totalBalance: user.totalBalance,
            byCategoryIncome: [],
            byCategoryExpense: [],
        };

        const addedIncomeCategories = [];
        const addedExpenseCategories = [];

        transactions.forEach((transaction) => {
            if (transaction.type === TransactionType.INCOME) {
                statisticData.totalIncome += +transaction.amount;

                let parentId = transaction.category.parentId;
                if (!parentId){
                    parentId = transaction.category.id;
                }

                if (!addedIncomeCategories.includes(parentId)) {
                    addedIncomeCategories.push(parentId);

                    statisticData.byCategoryIncome.push({
                        id: parentId,
                        amount: +transaction.amount,
                    });
                } else {
                    const categoryIndex = statisticData.byCategoryIncome.findIndex((category) => category.id === parentId);
                    statisticData.byCategoryIncome[categoryIndex].amount += +transaction.amount;
                }


            } else if (transaction.type === TransactionType.EXPENSE) {
                statisticData.totalExpense += +transaction.amount;

                let parentId = transaction.category.parentId;
                if (!parentId){
                    parentId = transaction.category.id;
                }

                if (!addedExpenseCategories.includes(parentId)) {
                    addedExpenseCategories.push(parentId);

                    statisticData.byCategoryExpense.push({
                        id: parentId,
                        amount: +transaction.amount,
                    });
                } else {
                    const categoryIndex = statisticData.byCategoryExpense.findIndex((category) => category.id === parentId);
                    statisticData.byCategoryExpense[categoryIndex].amount += +transaction.amount;
                }
            }
        });

        console.log(">>>>> bat dau cache");
        await this.cacheService.set(cacheKey, statisticData, 24 * 60 * 60); // Cache for 24 hours

        return statisticData;
    }
}