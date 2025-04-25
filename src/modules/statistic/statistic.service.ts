import { Injectable, UnauthorizedException } from "@nestjs/common";
import { StatisticType } from "./type/type";
import * as dayjs from 'dayjs';
import { AppCacheService } from "../cache/cache.service";
import { Category, GeneralTransaction, User } from "src/database/models";
import { Op } from "sequelize";
import { TransactionType } from "src/shared/enums/transaction";
import { StatisticData } from "./statistic.dto";
import { StatisticTypeTtl } from "./type/enum";



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
                    transactionDate: {
                        [Op.gte]: dayjs().startOf('day').toDate(),
                        [Op.lte]: dayjs().endOf('day').toDate(),
                    },
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

        const statisticData = this.calulateStatistic(transactions);
        statisticData.totalBalance = user.totalBalance;

        console.log(">>>>> bat dau cache");
        await this.cacheService.set(cacheKey, statisticData, StatisticTypeTtl.daily); // Cache for 24 hours

        return statisticData;
    }


    async getThisWeekStatistic(userId: number) {
        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const startOfWeek = dayjs().startOf('week').format('YYYY-MM-DD');
        const endOfWeek = dayjs().endOf('week').format('YYYY-MM-DD');
        const cacheKey = this.generateKey(userId, 'weekly', `${startOfWeek}-${endOfWeek}`);

        const cachedData = await this.cacheService.get(cacheKey);
        if (cachedData) {
            console.log(">>>> lay duoc cache roi ne. key: ", cacheKey);
            return cachedData;
        }

        const transactions = await GeneralTransaction.findAll(
            {
                where: {
                    userId,
                    transactionDate: {
                        [Op.gte]: dayjs().startOf('week').toDate(),
                        [Op.lte]: dayjs().endOf('week').toDate(),
                    },
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

        const statisticData = this.calulateStatistic(transactions);
        statisticData.totalBalance = user.totalBalance;

        console.log(">>>>> bat dau cache");
        await this.cacheService.set(cacheKey, statisticData, StatisticTypeTtl.weekly); // Cache for 1 week

        return statisticData;
    }


    async getThisMonthStatistic(userId: number) {
        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const month = dayjs().startOf('month').format('YYYY-MM');
        const cacheKey = this.generateKey(userId, 'monthly', `${month}`);

        const cachedData = await this.cacheService.get(cacheKey);
        if (cachedData) {
            console.log(">>>> lay duoc cache roi ne. key: ", cacheKey);
            return cachedData;
        }

        const transactions = await GeneralTransaction.findAll(
            {
                where: {
                    userId,
                    transactionDate: {
                        [Op.gte]: dayjs().startOf('month').toDate(),
                        [Op.lte]: dayjs().endOf('month').toDate(),
                    },
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

        const statisticData = this.calulateStatistic(transactions);
        statisticData.totalBalance = user.totalBalance;


        console.log(">>>>> bat dau cache");
        await this.cacheService.set(cacheKey, statisticData, StatisticTypeTtl.monthly); // Cache for 1 month

        return statisticData;
    }


    async getThisQuarterStatistic(userId: number) {
        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const now = dayjs();
        const currentMonth = now.month(); // 0-11
        const quarter = Math.ceil((currentMonth + 1) / 3);
        const year = now.year();

        // Tính thủ công ngày bắt đầu và kết thúc của quý
        const startMonth = (quarter - 1) * 3; // 0, 3, 6, 9
        const startDate = dayjs().year(year).month(startMonth).startOf('month');
        const endDate = dayjs().year(year).month(startMonth + 2).endOf('month');

        const cacheKey = this.generateKey(userId, 'quarterly', `${year}-Q${quarter}`);

        const cachedData = await this.cacheService.get(cacheKey);
        if (cachedData) {
            console.log(">>>> lay duoc cache roi ne. key: ", cacheKey);
            return cachedData;
        }

        const transactions = await GeneralTransaction.findAll(
            {
                where: {
                    userId,
                    transactionDate: {
                        [Op.gte]: startDate.toDate(),
                        [Op.lte]: endDate.toDate(),
                    },
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

        const statisticData = this.calulateStatistic(transactions);
        statisticData.totalBalance = user.totalBalance;

        console.log(">>>>> bat dau cache");
        await this.cacheService.set(cacheKey, statisticData, StatisticTypeTtl.quarterly); // Cache for 3 months

        return statisticData;

    }


    async getThisYearStatistic(userId: number) {
        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const year = dayjs().year();
        const cacheKey = this.generateKey(userId, 'yearly', `${year}`);

        const cachedData = await this.cacheService.get(cacheKey);
        if (cachedData) {
            console.log(">>>> lay duoc cache roi ne. key: ", cacheKey);
            return cachedData;
        }

        const transactions = await GeneralTransaction.findAll(
            {
                where: {
                    userId,
                    transactionDate: {
                        [Op.gte]: dayjs().startOf('year').toDate(),
                        [Op.lte]: dayjs().endOf('year').toDate(),
                    },
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

        const statisticData = this.calulateStatistic(transactions);
        statisticData.totalBalance = user.totalBalance;


        console.log(">>>>> bat dau cache");
        await this.cacheService.set(cacheKey, statisticData, StatisticTypeTtl.yearly); // Cache for 1 year

        return statisticData;
    }


    calulateStatistic(transactions: GeneralTransaction[]): any {
        const statisticData = {
            totalIncome: 0,
            totalExpense: 0,
            byCategoryIncome: [],
            byCategoryExpense: [],
        };

        const addedIncomeCategories = [];
        const addedExpenseCategories = [];

        transactions.forEach((transaction) => {
            if (transaction.type === TransactionType.INCOME) {
                statisticData.totalIncome += +transaction.amount;

                let parentId = transaction.category.parentId;
                if (!parentId) {
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
                if (!parentId) {
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
        })

        return statisticData;
    }


    getCachedKeyTtl(key: string) {
        const statisticType = key.split(':')[2];

        const ttl = StatisticTypeTtl[statisticType as keyof typeof StatisticTypeTtl];
        return ttl;
    }


    /**
     * 
     * @param userId transactionDate is a string in format ISO 8601
     * @param transactionDate 
     */
    async getAffectedCacheKeys(userId: number, transactionDate: string) {
        const today = dayjs(transactionDate).format('YYYY-MM-DD');
        const startOfWeek = dayjs(transactionDate).startOf('week').format('YYYY-MM-DD');
        const endOfWeek = dayjs(transactionDate).endOf('week').format('YYYY-MM-DD');
        const month = dayjs(transactionDate).startOf('month').format('YYYY-MM');
        const year = dayjs(transactionDate).year();
        const quarter = Math.ceil((dayjs(transactionDate).month() + 1) / 3);

        return [
            this.generateKey(userId, 'daily', today),
            this.generateKey(userId, 'weekly', `${startOfWeek}-${endOfWeek}`),
            this.generateKey(userId, 'monthly', `${month}`),
            this.generateKey(userId, 'quarterly', `${year}-Q${quarter}`),
            this.generateKey(userId, 'yearly', `${year}`),
        ];
    }


    async updatateCache(userId: number, transaction: GeneralTransaction) {
        const affectedCacheKeys = await this.getAffectedCacheKeys(userId, transaction.transactionDate);
        for (const key of affectedCacheKeys) {
            const cachedData = await this.cacheService.get(key);

            if (!cachedData) {
                //just return, data will be updated when user call get statistic again
                return;
            }

            const newData = await this.getNewData(transaction, cachedData as StatisticData);
            
            await this.cacheService.set(key, newData, this.getCachedKeyTtl(key));

            console.log("updated cache: ", key);
        }
    }

    async getNewData(transaction: GeneralTransaction, oldData: StatisticData){
        const newData = {...oldData}

        const category = await Category.findOne({ where: { id: transaction.categoryId } });

        if (transaction.type === TransactionType.INCOME) {
            newData.totalIncome += +transaction.amount;
            newData.totalBalance += +transaction.amount;

            const categoryId = category.parentId || category.id;

            if (newData.byCategoryIncome.findIndex((category) => category.id === categoryId) === -1) {
                //if categoryId is not in the list, add it
                newData.byCategoryIncome.push({
                    id: categoryId,
                    amount: +transaction.amount,
                });
            } else {
                //if categoryId is already in the list, update the amount
                const categoryIndex = newData.byCategoryIncome.findIndex((category) => category.id === categoryId);
                newData.byCategoryIncome[categoryIndex].amount += +transaction.amount;
            }
        } else if (transaction.type === TransactionType.EXPENSE) {
            newData.totalExpense += +transaction.amount;
            newData.totalBalance -= +transaction.amount;

            const categoryId = category.parentId || category.id;

            if (newData.byCategoryExpense.findIndex((category) => category.id === categoryId) === -1) {
                //if categoryId is not in the list, add it
                newData.byCategoryExpense.push({
                    id: categoryId,
                    amount: +transaction.amount,
                });
            } else {
                //if categoryId is already in the list, update the amount
                const categoryIndex = newData.byCategoryExpense.findIndex((category) => category.id === categoryId);
                newData.byCategoryExpense[categoryIndex].amount += +transaction.amount;
            }
        }

        return newData;
    }
}