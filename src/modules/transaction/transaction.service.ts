import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";
import { GeneralTransaction, TransferTransaction } from "src/database/models";
import { TransactionType } from "src/shared/enums/transaction";
import { CreateGeneralTrans } from "src/shared/types/transactions/general";
import { CreateGeneralTransactionRequest, CreateTransferTransactionRequest } from "./transaction.dto";
import { UserService } from "../user/user.service";
import { WalletService } from "../wallet/wallet.service";
import { CategoryService } from "../category/category.service";
import { CategoryType } from "src/shared/enums/category";

@Injectable()
export class TransactionService {
    constructor(
        private readonly userService: UserService,
        private readonly categoryService: CategoryService,
        private readonly walletService: WalletService,
        private readonly sequelize: Sequelize
    ) {}

    async createGeneralTransaction(params: CreateGeneralTrans, t?: any): Promise<GeneralTransaction> {
        return await GeneralTransaction.create({
            ...params
        }, { transaction: t });
    }

    async createIncome(body: CreateGeneralTransactionRequest, userId: number): Promise<GeneralTransaction> {
        if (body.amount <= 0) {
            throw new BadRequestException('Transaction amount must be positive');
        }

        const wallet = await this.walletService.findById(body.sourceWalletId, userId);
        //TODO: valid wallet type later
        const category = await this.categoryService.findById(body.categoryId, userId);
        if (category.type !== CategoryType.INCOME) {
            throw new BadRequestException('Invalid category type for income transaction');
        }

        try {
            const result = await this.sequelize.transaction(async (t) => {
                // Create the transaction record
                const transaction = await this.createGeneralTransaction({
                    type: TransactionType.INCOME,
                    ...body,
                    userId
                }, t);

                // Update user's total balance
                await this.userService.increaseTotalBalance(userId, body.amount, t);
                
                // Update wallet balance
                await this.walletService.increaseBalance(body.sourceWalletId, body.amount, t);

                return transaction;
            });

            return {
                ...result.dataValues,
                category,
                sourceWallet: wallet
            };
        } catch (error) {
            throw new BadRequestException(`Failed to create income transaction: ${error.message}`);
        }
    }

    async createExpense(body: CreateGeneralTransactionRequest, userId: number): Promise<GeneralTransaction> {
        if (body.amount <= 0) {
            throw new BadRequestException('Transaction amount must be positive');
        }

        const wallet = await this.walletService.findById(body.sourceWalletId, userId);
        //TODO: valid wallet type later
        const category = await this.categoryService.findById(body.categoryId, userId);
        if (category.type !== CategoryType.EXPENSE) {
            throw new BadRequestException('Invalid category type for expense transaction');
        }

        try {
            const result = await this.sequelize.transaction(async (t) => {
                // Create the transaction record
                const transaction = await this.createGeneralTransaction({
                    type: TransactionType.EXPENSE,
                    ...body,
                    userId
                }, t);

                // Update user's total balance
                await this.userService.decreaseTotalBalance(userId, body.amount, t);
                
                // Update wallet balance
                await this.walletService.decreaseBalance(body.sourceWalletId, body.amount, t);

                return transaction;
            });

            return {
                ...result.dataValues,
                category,
                sourceWallet: wallet
            };
        } catch (error) {
            throw new BadRequestException(`Failed to create expense transaction: ${error.message}`);
        }
    }

    async createTransfer(body: CreateTransferTransactionRequest, userId: number) {
        if (body.amount <= 0) {
            throw new BadRequestException('Transaction amount must be positive');
        }

        const sourceWallet = await this.walletService.findById(body.sourceWalletId, userId);
        const destinationWallet = await this.walletService.findById(body.destinationWalletId, userId);

        if (sourceWallet.id === destinationWallet.id) {
            throw new BadRequestException('Source wallet and destination wallet must be different');
        }

        try {
            const result = await this.sequelize.transaction(async (t) => {
                // Create the transaction record
                const transaction = await this.createGeneralTransaction({
                    type: TransactionType.TRANSFER,
                    ...body,
                    categoryId: null,
                    userId
                }, t);

                // Update source wallet balance
                await this.walletService.decreaseBalance(body.sourceWalletId, body.amount, t);

                // Update destination wallet balance
                await this.walletService.increaseBalance(body.destinationWalletId, body.amount, t);

                await TransferTransaction.create({
                    generalTransactionId: transaction.id,
                    destinationWalletId: body.destinationWalletId
                }, { transaction: t });

                return transaction;
            });

            return {
                ...result.dataValues,
                sourceWallet,
                destinationWalletId: body.destinationWalletId,
                destinationWallet
            };
        } catch (error) {
            throw new BadRequestException(`Failed to create transfer transaction: ${error.message}`);
        }
    }

}