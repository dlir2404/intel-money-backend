import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateRequest } from "./wallet.dto";
import { Wallet } from "src/database/models";
import { Transaction } from "sequelize";


@Injectable()
export class WalletService {
    async createDefaultWallets(userId: number, t?: Transaction) {
        const defaultWallet = {
            name: "Default Wallet",
            description: "Default wallet created for the user",
            icon: "default-icon.png",
            balance: 0,
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

    async create(body: CreateRequest, userId: number) {
        const res = await Wallet.create({ ...body, userId });
        return res.dataValues;
    }

    async update(id: number, userId: number, body: CreateRequest) {
        const wallet = await Wallet.findOne({
            where: { id, userId }
        })

        if (!wallet) {
            throw new NotFoundException("Wallet not found");
        }

        const res = await wallet.update(body);
        return res.dataValues;
    }

    async delete(id: number, userId: number) {
        const wallet = await Wallet.findOne({
            where: { id, userId }
        })

        if (!wallet) {
            throw new NotFoundException("Wallet not found");
        }

        await wallet.destroy();

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