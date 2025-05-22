import {BadRequestException, ForbiddenException, Injectable, InternalServerErrorException} from "@nestjs/common";
import {Category, GeneralTransaction, RelatedUser, Wallet} from "../../database/models";
import {Op, Transaction} from "sequelize";
import {CategorySyncData, RelatedUserSyncData, SyncRequest, WalletSyncData} from "./dto";
import {AppCacheService} from "../cache/cache.service";
import {Sequelize} from "sequelize-typescript";
import {InternalServerError} from "openai";

@Injectable()
export class SyncService {
    constructor(
        private readonly cacheService: AppCacheService,
        private readonly sequelize: Sequelize,
    ) { }

    async syncData(userId: number, data: SyncRequest){
        const lockKey = `sync:user:${userId}`;
        if (await this.cacheService.get(lockKey)) {
            throw new ForbiddenException("Sync is already in progress");
        }
        // lock to prevent race condition
        await this.cacheService.set(lockKey, true, -1);

        try {
            const result = await this.sequelize.transaction(async (t) => {
                //IMPORTANT: if category, wallet, related user have rows deleted, we need to delete the transactions that are related to them
                //or just simple by set them as deleted

                //category sync first
                const categorySyncedData = await this.syncCategories(userId, data.categories, t);

                //sync wallets
                const walletSyncedData = await this.syncWallets(userId, data.wallets, t);

                //sync related users
                const relatedUserSyncedData = await this.syncRelatedUsers(userId, data.relatedUsers, t);

                //sync transactions

                return {
                    categories: categorySyncedData,
                    wallets: walletSyncedData,
                    relatedUsers: relatedUserSyncedData
                }
            });
            //unlock
            await this.cacheService.del(lockKey);


            return result;
        } catch (error) {
            //unlock
            await this.cacheService.del(lockKey);

            throw error;
        }
    }

    async syncCategories(userId: number, data: CategorySyncData, t: Transaction){
        //sync create first
        const createdCategories = [];
        for (const category of data.create) {
            const newCategory = await Category.create({
                ...category,
                userId: userId
            }, {transaction: t});

            createdCategories.push(newCategory.dataValues);
        }

        //sync update category
        const updatedCategories = [];
        for (const category of data.update) {
            const updatedCategory = await Category.findOne({
                where: {
                    id: category.id,
                    userId: userId
                },
            });

            if (updatedCategory) {
                await updatedCategory.update({
                    ...category
                }, {transaction: t});

                updatedCategories.push(updatedCategory.dataValues);
            }
        }

        //sync delete category
        for (const categoryId of data.delete) {
            const deletedCategory = await Category.findOne({
                where: {
                    id: categoryId,
                    userId: userId
                }
            });

            if (deletedCategory) {
                await deletedCategory.destroy({
                    transaction: t
                });
            }
        }

        return {
            created: createdCategories,
            updated: updatedCategories,
            deleted: data.delete
        };
    }

    async syncWallets(userId: number, data: WalletSyncData, t: Transaction){
        //sync create first
        const createdWallets = [];
        for (const wallet of data.create) {
            const newWallet = await Wallet.create({
                ...wallet,
                userId: userId
            }, {transaction: t});

            createdWallets.push(newWallet.dataValues);
        }

        //sync update wallet
        const updatedWallets = [];
        for (const wallet of data.update) {
            const updatedWallet = await Wallet.findOne({
                where: {
                    id: wallet.id,
                    userId: userId
                },
            });

            if (updatedWallet) {
                await updatedWallet.update({
                    ...wallet
                }, {transaction: t});

                updatedWallets.push(updatedWallet.dataValues);
            }
        }

        //sync delete wallet
        for (const walletId of data.delete) {
            const deletedWallet = await Wallet.findOne({
                where: {
                    id: walletId,
                    userId: userId
                }
            });

            if (deletedWallet) {
                await deletedWallet.destroy({
                    transaction: t
                });
            }
        }

        return {
            created: createdWallets,
            updated: updatedWallets,
            deleted: data.delete
        };
    }

    async syncRelatedUsers(userId: number, data: RelatedUserSyncData, t: Transaction){
        //sync create first
        const createdRelatedUsers = [];
        for (const relatedUser of data.create) {
            const newRelatedUser = await RelatedUser.create({
                ...relatedUser,
                userId: userId
            }, {transaction: t});

            createdRelatedUsers.push(newRelatedUser.dataValues);
        }

        //sync update related user
        const updatedRelatedUsers = [];
        for (const relatedUser of data.update) {
            const updatedRelatedUser = await RelatedUser.findOne({
                where: {
                    id: relatedUser.id,
                    userId: userId
                },
            });

            if (updatedRelatedUser) {
                await updatedRelatedUser.update({
                    ...relatedUser
                }, {transaction: t});

                updatedRelatedUsers.push(updatedRelatedUser.dataValues);
            }
        }

        //sync delete related user
        for (const relatedUserId of data.delete) {
            const deletedRelatedUser = await RelatedUser.findOne({
                where: {
                    id: relatedUserId,
                    userId: userId
                }
            });

            if (deletedRelatedUser) {
                await deletedRelatedUser.destroy({
                    transaction: t
                });
            }
        }

        return {
            created: createdRelatedUsers,
            updated: updatedRelatedUsers,
            deleted: data.delete
        };
    }

    //time is the time of the last sync on client, in UTC ISO8601 format
    async getNotSyncData(userId: number, time: string){
        let date = new Date(time);
        return {
            categories: await this.getNotSyncCategory(userId, date),
            wallets: await this.getNotSyncWallet(userId, date),
            relatedUsers: await this.getNotSyncRelatedUser(userId, date),
            transactions: await this.getNotSyncTransaction(userId, date)
        };
    }

    async getNotSyncCategory(userId: number, time: Date) {
        return await Category.findAll({
            where: {
                userId: userId,
                [Op.or]: [
                    {
                        updatedAt: {
                            [Op.gte]: time
                        }
                    },
                    {
                        createdAt: {
                            [Op.gte]: time
                        }
                    },
                    // {
                    //     deletedAt: {
                    //         [Op.gte]: time
                    //     }
                    // }
                ]
            },
            raw: true,
            paranoid: false // Include soft-deleted records
        });
    }

    async getNotSyncWallet(userId: number, time: Date) {
        return await Wallet.findAll({
            where: {
                userId: userId,
                [Op.or]: [
                    {
                        updatedAt: {
                            [Op.gte]: time
                        }
                    },
                    {
                        createdAt: {
                            [Op.gte]: time
                        }
                    },
                    // {
                    //     deletedAt: {
                    //         [Op.gte]: time
                    //     }
                    // }
                ]
            },
            raw: true,
            paranoid: false // Include soft-deleted records
        });
    }

    async getNotSyncRelatedUser(userId: number, time: Date) {
        return await RelatedUser.findAll({
            where: {
                userId: userId,
                [Op.or]: [
                    {
                        updatedAt: {
                            [Op.gte]: time
                        }
                    },
                    {
                        createdAt: {
                            [Op.gte]: time
                        }
                    },
                    // {
                    //     deletedAt: {
                    //         [Op.gte]: time
                    //     }
                    // }
                ]
            },
            raw: true,
            paranoid: false // Include soft-deleted records
        })
    }

    async getNotSyncTransaction(userId: number, time: Date) {
        return await GeneralTransaction.findAll({
            where: {
                userId: userId,
                [Op.or]: [
                    {
                        updatedAt: {
                            [Op.gte]: time
                        }
                    },
                    {
                        createdAt: {
                            [Op.gte]: time
                        }
                    },
                    // {
                    //     deletedAt: {
                    //         [Op.gte]: time
                    //     }
                    // }
                ]
            },
            raw: true,
            paranoid: false // Include soft-deleted records
        });
    }
}