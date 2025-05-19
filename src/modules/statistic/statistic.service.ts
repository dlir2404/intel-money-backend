import { Injectable, UnauthorizedException } from "@nestjs/common";
import { StatisticType } from "./type/type";
import * as dayjs from 'dayjs';
import { AppCacheService } from "../cache/cache.service";
import { Category, GeneralTransaction, User } from "src/database/models";
import { Op, WhereOptions } from "sequelize";
import { TransactionType } from "src/shared/enums/transaction";
import { StatisticData } from "./statistic.dto";
import { StatisticTypeTtl } from "./type/enum";
import { Time } from "src/shared/ultils/time";



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

        const timezone = user.preferences.timezone || 'UTC';

        const today = dayjs().tz(timezone).format('YYYY-MM-DD');
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
                        [Op.gte]: Time.startOfDayWithUserTimeZone(timezone).toDate(),
                        [Op.lte]: Time.endOfDayWithUserTimeZone(timezone).toDate(),
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
        const timezone = user.preferences.timezone || 'UTC';

        const startOfWeek = Time.startOfWeekWithUserTimeZone(timezone).format('YYYY-MM-DD');
        const endOfWeek = Time.endOfWeekWithUserTimeZone(timezone).format('YYYY-MM-DD');
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
                        [Op.gte]: Time.startOfWeekWithUserTimeZone(timezone).toDate(),
                        [Op.lte]: Time.endOfWeekWithUserTimeZone(timezone).toDate(),
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
        const timezone = user.preferences.timezone || 'UTC';


        const month: number = dayjs().tz(timezone).month(); // 0-11
        const year: number = dayjs().tz(timezone).year();

        return await this.getMonthlyStatistic({userId, month, year, timezone});
    }


    //month is from 0 to 11 already in user timezone
    //user must already exist in this step
    async getMonthlyStatistic({userId, month, year, timezone, categories, sourceWallets}:{userId: number, month: number, year: number, timezone: string, categories?: number[], sourceWallets?: number[]}) {
        let timeRange = `${year}-${month + 1}`;
        if (month < 9) {
            timeRange = `${year}-0${month + 1}`;
        }
        const cacheKey = this.generateKey(userId, 'monthly', timeRange);

        //neu khong co them filters ve account hoac la category thi moi co data cached
        if (!((categories && categories.length > 0) || (sourceWallets && sourceWallets.length > 0))) {
            const cachedData = await this.cacheService.get(cacheKey);
            if (cachedData) {
                return cachedData;
            }
        }

        let where: WhereOptions<GeneralTransaction> = {
            userId,
            transactionDate: {
                [Op.gte]: dayjs().year(year).month(month).tz(timezone).startOf('month').toDate(),
                [Op.lte]: dayjs().year(year).month(month).tz(timezone).endOf('month').toDate(),
            },
        }

        if (categories && categories.length > 0) {
            where['categoryId'] = {
                [Op.in]: categories,
            }
        }

        if (sourceWallets && sourceWallets.length > 0) {
            where['sourceWalletId'] = {
                [Op.in]: sourceWallets,
            }
        }

        const transactions = await GeneralTransaction.findAll(
            {
                where,
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
        //TODO: fix this later
        statisticData.totalBalance = 0;

        // neu khong co them filters ve account hoac la category thi moi cached data
        if (!((categories && categories.length > 0) || (sourceWallets && sourceWallets.length > 0))) {
            await this.cacheService.set(cacheKey, statisticData, StatisticTypeTtl.monthly); // Cache for 1 month
        }

        return statisticData;
    }


    async getThisQuarterStatistic(userId: number) {
        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        const timezone = user.preferences.timezone || 'UTC';

        const now = Time.nowWithUserTimeZone(timezone);
        const quarter = now.quarter(); // 1-4
        const year = now.year();

        return await this.getQuarterlyStatistic(userId, quarter, year, timezone);
    }


    //month is from 0 to 11 already in user timezone
    //user must already exist in this step
    async getQuarterlyStatistic(userId: number, quarter: number, year: number, timezone: string) {
        let timeRange = `${year}-Q${quarter}`;
        const cacheKey = this.generateKey(userId, 'quarterly', timeRange);
        const cachedData = await this.cacheService.get(cacheKey);
        if (cachedData) {
            console.log(">>>> lay duoc cache roi ne. key: ", cacheKey);
            return cachedData;
        }

        // Tính thủ công ngày bắt đầu và kết thúc của quý
        const startDate = dayjs().year(year).quarter(quarter).tz(timezone).startOf('quarter');
        const endDate = dayjs().year(year).quarter(quarter).tz(timezone).endOf('quarter');

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
        statisticData.totalBalance = 0; //TODO: fix this later

        console.log(">>>>> bat dau cache");
        await this.cacheService.set(cacheKey, statisticData, StatisticTypeTtl.quarterly); // Cache for 3 months
        return statisticData;
    }


    async getThisYearStatistic(userId: number) {
        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        const timezone = user.preferences.timezone || 'UTC';

        const year = Time.nowWithUserTimeZone(timezone).year();
        const cacheKey = this.generateKey(userId, 'yearly', `${year}`);

        const cachedData: any = await this.cacheService.get(cacheKey);
        if (cachedData) {
            console.log(">>>> lay duoc cache roi ne. key: ", cacheKey);
            let byMonthStatistic = [];
            for (let month = 0; month < 12; month++) {
                let data = await this.getMonthlyStatistic({userId, month, year, timezone});
                byMonthStatistic.push(data);
            }
            cachedData.byMonthStatistic = byMonthStatistic;

            let byQuarterStatistic = [];
            for (let quarter = 1; quarter <= 4; quarter++) {
                let data = await this.getQuarterlyStatistic(userId, quarter, year, timezone);
                byQuarterStatistic.push(data);
            }
            cachedData.byQuarterStatistic = byQuarterStatistic;
            return cachedData;
        }

        const transactions = await GeneralTransaction.findAll(
            {
                where: {
                    userId,
                    transactionDate: {
                        [Op.gte]: Time.nowWithUserTimeZone(timezone).startOf('year').toDate(),
                        [Op.lte]: Time.nowWithUserTimeZone(timezone).endOf('year').toDate(),
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

        //this is only general statistics
        const statisticData = this.calulateStatistic(transactions);
        statisticData.totalBalance = user.totalBalance;

        console.log(">>>>> bat dau cache");
        await this.cacheService.set(cacheKey, statisticData, StatisticTypeTtl.yearly); // Cache for 1 year

        //these extra statistics are cached in those own cache keys so do not need to cache them again
        let byMonthStatistic = [];
        for (let month = 0; month < 12; month++) {
            let data = await this.getMonthlyStatistic({userId, month, year, timezone});
            byMonthStatistic.push(data);
        }
        statisticData.byMonthStatistic = byMonthStatistic;

        let byQuarterStatistic = [];
        for (let quarter = 1; quarter <= 4; quarter++) {
            let data = await this.getQuarterlyStatistic(userId, quarter, year, timezone);
            byQuarterStatistic.push(data);
        }
        statisticData.byQuarterStatistic = byQuarterStatistic;

        return statisticData;
    }


    async getYearlyStatistic(userId: number, year: number) {
        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        const timezone = user.preferences.timezone || 'UTC';

        const cacheKey = this.generateKey(userId, 'yearly', `${year}`);

        const cachedData: any = await this.cacheService.get(cacheKey);
        if (cachedData) {
            console.log(">>>> lay duoc cache roi ne. key: ", cacheKey);
            let byMonthStatistic = [];
            for (let month = 0; month < 12; month++) {
                let data = await this.getMonthlyStatistic({userId, month, year, timezone});
                byMonthStatistic.push(data);
            }
            cachedData.byMonthStatistic = byMonthStatistic;

            let byQuarterStatistic = [];
            for (let quarter = 1; quarter <= 4; quarter++) {
                let data = await this.getQuarterlyStatistic(userId, quarter, year, timezone);
                byQuarterStatistic.push(data);
            }
            cachedData.byQuarterStatistic = byQuarterStatistic;
            return cachedData;
        }

        const transactions = await GeneralTransaction.findAll(
            {
                where: {
                    userId,
                    transactionDate: {
                        [Op.gte]: Time.nowWithUserTimeZone(timezone).year(year).startOf('year').toDate(),
                        [Op.lte]: Time.nowWithUserTimeZone(timezone).year(year).endOf('year').toDate(),
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

        //this is only general statistics
        const statisticData = this.calulateStatistic(transactions);
        statisticData.totalBalance = user.totalBalance;

        console.log(">>>>> bat dau cache");
        await this.cacheService.set(cacheKey, statisticData, StatisticTypeTtl.yearly); // Cache for 1 year

        //these extra statistics are cached in those own cache keys so do not need to cache them again
        let byMonthStatistic = [];
        for (let month = 0; month < 12; month++) {
            let data = await this.getMonthlyStatistic({userId, month, year, timezone});
            byMonthStatistic.push(data);
        }
        statisticData.byMonthStatistic = byMonthStatistic;

        let byQuarterStatistic = [];
        for (let quarter = 1; quarter <= 4; quarter++) {
            let data = await this.getQuarterlyStatistic(userId, quarter, year, timezone);
            byQuarterStatistic.push(data);
        }
        statisticData.byQuarterStatistic = byQuarterStatistic;

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

    calulateCompactStatistic(transactions: GeneralTransaction[]): any {
        const statisticData = {
            totalIncome: 0,
            totalExpense: 0,
        };

        transactions.forEach((transaction) => {
            if (transaction.type === TransactionType.INCOME) {
                statisticData.totalIncome += +transaction.amount;
            } else if (transaction.type === TransactionType.EXPENSE) {
                statisticData.totalExpense += +transaction.amount;
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
        const user = await User.findOne({ where: { id: userId } });
        const timezone = user.preferences.timezone || 'UTC';

        const today = dayjs(transactionDate).tz(timezone).format('YYYY-MM-DD');
        const startOfWeek = dayjs(transactionDate).tz(timezone).startOf('week').format('YYYY-MM-DD');
        const endOfWeek = dayjs(transactionDate).tz(timezone).endOf('week').format('YYYY-MM-DD');
        const month = dayjs(transactionDate).tz(timezone).startOf('month').format('YYYY-MM');
        const year = dayjs(transactionDate).tz(timezone).year();
        const quarter = dayjs(transactionDate).tz(timezone).quarter();

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
                //just continue, data will be updated when user call get statistic again
                continue;
            }

            const newData = await this.getNewData(transaction, cachedData as StatisticData);

            await this.cacheService.set(key, newData, this.getCachedKeyTtl(key));

            console.log("updated cache: ", key);
        }
    }

    async getNewData(transaction: GeneralTransaction, oldData: StatisticData) {
        const newData = { ...oldData }

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


    /**
     * Nhận xét: phần xem analysis này user khá là ít dùng, có thể cached theo from & to trong vòng 1 h
     * from & to is a string in format ISO 8601 UTC
     * @param userId 
     * @param query 
     * @returns 
     */
    async getByDayStatistic(userId: number, query: { from: string, to: string, categories?: number[], sourceWallets?: number[] }) {
        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        const timezone = user.preferences.timezone || 'UTC';

        const startDay = dayjs(query.from).tz(timezone);
        const endDay = dayjs(query.to).tz(timezone);

        const cacheKey = this.generateKey(userId, 'byday', `${startDay.format('YYYY-MM-DD')}-${endDay.format('YYYY-MM-DD')}`);

        //neu khong co them filters ve account hoac la category thi moi co data cached
        if (!((query.categories && query.categories.length > 0) || (query.sourceWallets && query.sourceWallets.length > 0))) {
            const cachedData: any = await this.cacheService.get(cacheKey);
            if (cachedData) {
                console.log(">>>> lay duoc cache roi ne. key: ", cacheKey);
                return cachedData;
            }
        }

        let where: WhereOptions<GeneralTransaction> = {
            userId,
            transactionDate: {
                [Op.gte]: startDay.startOf('day').toDate(),
                [Op.lte]: endDay.endOf('day').toDate(),
            },
        }

        if (query.categories && query.categories.length > 0) {
            //TODO: need to check existing
            where['categoryId'] = {
                [Op.in]: query.categories,
            }
        }

        if (query.sourceWallets && query.sourceWallets.length > 0) {
            //TODO: need to check existing
            where['sourceWalletId'] = {
                [Op.in]: query.sourceWallets,
            }
        }

        const transactions = await GeneralTransaction.findAll(
            {
                where,
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

        const transactionsByDay = {};
        let dateRanges = [startDay, ...Time.daysBetween(startDay, endDay), endDay];
        dateRanges.forEach((day) => {
            transactionsByDay[day.format('YYYY-MM-DD')] = [];
        })

        transactions.forEach((transaction) => {
            const dateKey = dayjs(transaction.transactionDate).format('YYYY-MM-DD');
            
            if (!transactionsByDay[dateKey]) {
                transactionsByDay[dateKey] = [];
            }

            transactionsByDay[dateKey].push(transaction);
        });

        const dataByDay = Object.keys(transactionsByDay).map((date) => {
            return {
                date: dayjs(date).toISOString(),
                statisticData: this.calulateCompactStatistic(transactionsByDay[date]),
            }
        });

        // neu khong co them filters ve account hoac la category thi moi cached data
        if (!((query.categories && query.categories.length > 0) || (query.sourceWallets && query.sourceWallets.length > 0))) {
            await this.cacheService.set(cacheKey, dataByDay, StatisticTypeTtl.oneHour);
        }

        return dataByDay;
    }

    async getByMonthStatistic(userId: number, query: { from: string, to: string, categories?: number[], sourceWallets?: number[]  }) {
        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        const timezone = user.preferences.timezone || 'UTC';

        const startDay = dayjs(query.from).tz(timezone).startOf('month');
        const endDay = dayjs(query.to).tz(timezone).endOf('month');
        const monthRange = Time.getMonthsRange(startDay, endDay);

        let byMonthStatistic = [];
        for (let month of monthRange) {
            let data = await this.getMonthlyStatistic({userId, month: month.month(), year: month.year(), timezone, categories: query.categories, sourceWallets: query.sourceWallets});
            byMonthStatistic.push({
                date: month.toISOString(),
                statisticData: data
            });
        }

        return byMonthStatistic;
    }


    //todo: can be optimized later
    async getByYearStatistic(userId: number, query: { from: string, to: string }) {
        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        const timezone = user.preferences.timezone || 'UTC';

        const startDay = dayjs(query.from).tz(timezone).startOf('year');
        const endDay = dayjs(query.to).tz(timezone).endOf('year');
        const yearRange = Time.getYearsRange(startDay, endDay);

        console.log("year range: ", yearRange.map((year) => year.year()))

        let byYearStatistic = [];
        for (let year of yearRange) {
            let data = await this.getYearlyStatistic(userId, year.year());
            byYearStatistic.push({
                date: year.toISOString(),
                statisticData: data
            });
        }
        return byYearStatistic;
    }

    // from & to in format ISO 8601 UTC
    async getCustomRangeStatistic(userId: number, query: { from: string, to: string }) {
        const user = await User.findOne({where: {id: userId}});
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const transactions = await GeneralTransaction.findAll(
            {
                where: {
                    userId,
                    transactionDate: {
                        [Op.gte]: dayjs(query.from).toDate(),
                        [Op.lte]: dayjs(query.to).toDate(),
                    },
                },
                nest: true,
                raw: true,
            }
        );
        const statisticData = this.calulateCompactStatistic(transactions);

        return statisticData;
    }
}