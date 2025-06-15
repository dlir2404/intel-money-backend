import { forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { CreateWalletRequest } from "./wallet.dto";
import { Wallet } from "src/database/models";
import { Transaction } from "sequelize";
import { TransactionService } from "../transaction/transaction.service";
import { UserService } from "../user/user.service";
import { Sequelize } from "sequelize-typescript";


@Injectable()
export class WalletService {
    constructor(
        @Inject(forwardRef(() => TransactionService)) private readonly transactionService: TransactionService,
        private readonly userService: UserService,
        private readonly sequelize: Sequelize,

    ) { }
    async createDefaultWallets(userId: number, t?: Transaction) {
        const defaultWallet = {
            name: "Tiền mặt",
            description: "",
            icon: "default-icon.png",
            balance: 0,
            baseBalance: 0,
            userId: userId,
        }

        await Wallet.findOrCreate({
            where: { name: defaultWallet.name, userId: defaultWallet.userId },
            defaults: defaultWallet,
            transaction: t,
        });
    }


    async findById(id: number, userId: number) {
        const wallet = await Wallet.findOne({
            where: { id, userId },
            raw: true
        });

        if (!wallet) {
            throw new NotFoundException('Wallet not found');
        }

        return wallet;
    }

    async create(body: CreateWalletRequest, userId: number) {
        try {
            const result = await this.sequelize.transaction(async (t: Transaction) => {
                const res = await Wallet.create({ ...body, balance: body.baseBalance, userId }, { transaction: t });

                if (body.baseBalance > 0) {
                    await this.userService.increaseTotalBalance(userId, body.baseBalance, t);
                }

                return res;
            })

            return result.dataValues;

        } catch (error) {
            throw new InternalServerErrorException("Failed to create wallet");
        }
    }

    async update(id: number, userId: number, body: CreateWalletRequest) {
        const wallet = await Wallet.findOne({
            where: { id, userId }
        })

        if (!wallet) {
            throw new NotFoundException("Wallet not found");
        }

        const firstModifyBalanceTransactions = await this.transactionService.getFirstModifyBalanceTransactions(userId, id);

        //case 1: base balance is not changed
        if (body.baseBalance == wallet.baseBalance) {
            await wallet.update(body);
            return wallet.dataValues;
        } else {
            try {
                const result = await this.sequelize.transaction(async (t: Transaction) => {
                    const differ = body.baseBalance - wallet.baseBalance;

                    if (firstModifyBalanceTransactions) {
                        //ex: base: 0, mod +100 => new base: 20 => only mod + 80
                        //ex2: base: 20, mode +80 => new base: 0 => differ is -20 => mode +100

                        await firstModifyBalanceTransactions.update({
                            amount: firstModifyBalanceTransactions.amount - differ
                        }, { transaction: t });
                    } else {
                        if (differ > 0) {
                            await this.userService.increaseTotalBalance(userId, differ, t);
                        } else {
                            await this.userService.decreaseTotalBalance(userId, -differ, t);
                        }
                    }


                    const res = await wallet.update(body);
                    return res.dataValues;
                });

                return result;
            } catch (error) {
                throw new InternalServerErrorException("Failed to update wallet");
            }
        }
    }

    async delete(id: number, userId: number) {
        const wallet = await Wallet.findOne({
            where: { id, userId }
        })

        if (!wallet) {
            throw new NotFoundException("Wallet not found");
        }

        await this.transactionService.removeTransactionByWalletId(userId, id, async (t: Transaction) => {
            if (wallet.baseBalance > 0) {
                await this.userService.decreaseTotalBalance(userId, wallet.baseBalance, t);
            }

            await wallet.destroy({ transaction: t });
        });

        return { result: true };
    }

    async findAll(userId: number) {
        return await Wallet.findAll({
            where: { userId },
            raw: true
        },);
    }

    async getAllToJson(userId: number) {
        const wallets = await this.findAll(userId);
        return JSON.stringify(wallets.map((wallet) => {
            return {
                id: wallet.id,
                name: wallet.name,
            };
        }));
    }

    async increaseBalance(walletId: number, amount: number, t: Transaction) {
        await Wallet.increment({ balance: amount }, { where: { id: walletId }, transaction: t });
    }

    async decreaseBalance(walletId: number, amount: number, t: Transaction) {
        await Wallet.decrement({ balance: amount }, { where: { id: walletId }, transaction: t });
    }

    async setBalance(walletId: number, newBalance: number, t: Transaction) {
        const wallet = await Wallet.findByPk(walletId, { transaction: t });
        if (!wallet) {
            throw new NotFoundException("Wallet not found");
        }
        await wallet.update({ balance: newBalance }, { transaction: t });
    }
}