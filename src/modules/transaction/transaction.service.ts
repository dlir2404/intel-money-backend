import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";
import { BorrowTransaction, GeneralTransaction, LendTransaction, TransferTransaction } from "src/database/models";
import { TransactionType } from "src/shared/enums/transaction";
import { CreateGeneralTrans } from "src/shared/types/transactions/general";
import { CreateGeneralTransactionRequest, CreateTransferTransactionRequest, GetAllTransactionsRequest } from "./transaction.dto";
import { UserService } from "../user/user.service";
import { WalletService } from "../wallet/wallet.service";
import { CategoryService } from "../category/category.service";
import { CategoryType } from "src/shared/enums/category";
import { RelatedUserService } from "../related-user/related-user.service";
import { col, Transaction, WhereOptions } from "sequelize";
import { Op } from "sequelize";
import { StatisticService } from "../statistic/statistic.service";

@Injectable()
export class TransactionService {
    constructor(
        private readonly userService: UserService,
        private readonly categoryService: CategoryService,
        private readonly walletService: WalletService,
        private readonly relatedUserService: RelatedUserService,
        private readonly sequelize: Sequelize,
        private readonly statisticService: StatisticService,
    ) {}

    async getAllTransactionsTestOnly(userId: number) {
        const where: WhereOptions<GeneralTransaction> = {
            userId: userId,
        };


        const transactions = await GeneralTransaction.findAll({
            where,
            raw: true,
            order: [['transactionDate', 'DESC']],
        });

        return transactions;
    }


    async getAllTransactions(userId: number, query: GetAllTransactionsRequest) {
        const { from, to } = query;

        const where: WhereOptions<GeneralTransaction> = {
            userId: userId,
            transactionDate: {
                [Op.between]: [from, to]
            },
        };


        const transactions = await GeneralTransaction.findAll({
            where,
            order: [['transactionDate', 'DESC']],
            raw: true,
        });

        return transactions;
    }
        


    async createGeneralTransaction(params: CreateGeneralTrans, t?: any): Promise<GeneralTransaction> {
        const transaction = await GeneralTransaction.create({
            ...params
        }, { transaction: t });


        await this.statisticService.updatateCache(params.userId, transaction);

        return transaction;
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

    async createIncomeWithTransaction(body: CreateGeneralTransactionRequest, userId: number, t: Transaction) {
        if (body.amount <= 0) {
            throw new BadRequestException('Transaction amount must be positive');
        }

        const wallet = await this.walletService.findById(body.sourceWalletId, userId);
        //TODO: valid wallet type later
        const category = await this.categoryService.findById(body.categoryId, userId);
        if (category.type !== CategoryType.INCOME) {
            throw new BadRequestException('Invalid category type for income transaction');
        }

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
    }


    async createBulkIncome(transactions: CreateGeneralTransactionRequest[], userId: number) {
        try {
            await this.sequelize.transaction(async (t) => {
                for (const transaction of transactions) {
                    await this.createIncomeWithTransaction(transaction, userId, t);
                }
            });
        } catch (error) {
            throw new BadRequestException(`Failed to create bulk income transactions: ${error.message}`);
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

    async createLend(body: any, userId: number) {
        if (body.amount <= 0) {
            throw new BadRequestException('Transaction amount must be positive');
        }

        const sourceWallet = await this.walletService.findById(body.sourceWalletId, userId);
        const borrower = await this.relatedUserService.findById(body.borrowerId, userId);

        try {
            const result = await this.sequelize.transaction(async (t) => {
                // Create the transaction record
                const transaction = await this.createGeneralTransaction({
                    type: TransactionType.LEND,
                    ...body,
                    categoryId: null,
                    userId
                }, t);

                //Update user's total balance
                await this.userService.decreaseTotalBalance(userId, body.amount, t);

                // Update source wallet balance
                await this.walletService.decreaseBalance(body.sourceWalletId, body.amount, t);

                // Update user's total loan
                await this.userService.increaseTotalLoan(userId, body.amount, t);

                // Update borrower's total debt
                await this.relatedUserService.increaseTotalDebt(borrower.userId, body.amount, t);

                //add extra info to table
                await LendTransaction.create({
                    generalTransactionId: transaction.id,
                    borrowerId: body.borrowerId,
                    collectionDate: body.collectionDate,
                    collectedAmount: 0
                }, { transaction: t });

                return transaction;
            });

            return {
                ...result.dataValues,
                sourceWallet,
                borrower
            };
        } catch (error) {
            throw new BadRequestException(`Failed to create lend transaction: ${error.message}`);
        }
    }

    async createBorrow(body: any, userId: number) {
        if (body.amount <= 0) {
            throw new BadRequestException('Transaction amount must be positive');
        }

        const sourceWallet = await this.walletService.findById(body.sourceWalletId, userId);
        const lender = await this.relatedUserService.findById(body.lenderId, userId);

        try {
            const result = await this.sequelize.transaction(async (t) => {
                // Create the transaction record
                const transaction = await this.createGeneralTransaction({
                    type: TransactionType.BORROW,
                    ...body,
                    categoryId: null,
                    userId
                }, t);

                // Update source wallet balance
                await this.walletService.increaseBalance(body.sourceWalletId, body.amount, t);

                // Update user's total debt
                await this.userService.increaseTotalDebt(userId, body.amount, t);

                // Update lender's total loan
                await this.relatedUserService.increaseTotalLoan(lender.userId, body.amount, t);

                //add extra info to table
                await BorrowTransaction.create({
                    generalTransactionId: transaction.id,
                    lenderId: body.lenderId,
                    repaymentDate: body.repaymentDate,
                    repaymentAmount: 0
                }, { transaction: t });

                return transaction;
            });

            return {
                ...result.dataValues,
                sourceWallet,
                lender
            };
        } catch (error) {
            throw new BadRequestException(`Failed to create borrow transaction: ${error.message}`);
        }
    }
}