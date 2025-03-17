import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";
import { GeneralTransaction } from "src/database/models";
import { TransactionType } from "src/shared/enums/transaction";
import { CreateGeneralTrans } from "src/shared/types/transactions/general";
import { CreateIncomeRequest } from "./transaction.dto";
import { UserService } from "../user/user.service";
import { WalletService } from "../wallet/wallet.service";
import { CategoryService } from "../category/category.service";

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

    async createIncome(body: CreateIncomeRequest, userId: number): Promise<GeneralTransaction> {
        if (body.amount <= 0) {
            throw new BadRequestException('Transaction amount must be positive');
        }

        const category = await this.categoryService.findById(body.categoryId, userId);
        const wallet = await this.walletService.findById(body.sourceWalletId, userId);
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
}