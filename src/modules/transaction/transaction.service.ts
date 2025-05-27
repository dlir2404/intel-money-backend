import {BadRequestException, Injectable, InternalServerErrorException, NotFoundException} from "@nestjs/common";
import {Sequelize} from "sequelize-typescript";
import {BorrowTransaction, GeneralTransaction, LendTransaction, TransferTransaction} from "src/database/models";
import {TransactionType} from "src/shared/enums/transaction";
import {CreateGeneralTrans} from "src/shared/types/transactions/general";
import {
    CreateBorrowTransactionRequest,
    CreateGeneralTransactionRequest, CreateLendTransactionRequest,
    CreateTransferTransactionRequest,
    GetAllTransactionsRequest, UpdateBorrowTransactionRequest, UpdateExpenseTransactionRequest,
    UpdateIncomeTransactionRequest, UpdateLendTransactionRequest
} from "./transaction.dto";
import {UserService} from "../user/user.service";
import {WalletService} from "../wallet/wallet.service";
import {CategoryService} from "../category/category.service";
import {CategoryType} from "src/shared/enums/category";
import {RelatedUserService} from "../related-user/related-user.service";
import {Op, Transaction, WhereOptions} from "sequelize";
import {StatisticService} from "../statistic/statistic.service";

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


        await this.statisticService.updateCacheAfterCreateTransaction(params.userId, transaction);

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

    async createExpenseWithTransaction(body: CreateGeneralTransactionRequest, userId: number, t: Transaction) {
        if (body.amount <= 0) {
            throw new BadRequestException('Transaction amount must be positive');
        }

        const wallet = await this.walletService.findById(body.sourceWalletId, userId);
        const category = await this.categoryService.findById(body.categoryId, userId);
        if (category.type !== CategoryType.EXPENSE) {
            throw new BadRequestException('Invalid category type for expense transaction');
        }

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

    async createLend(body: CreateLendTransactionRequest, userId: number) {
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

    async createLendWithTransaction(body: CreateLendTransactionRequest, userId: number, t: Transaction) {
        if (body.amount <= 0) {
            throw new BadRequestException('Transaction amount must be positive');
        }

        const sourceWallet = await this.walletService.findById(body.sourceWalletId, userId);
        const borrower = await this.relatedUserService.findById(body.borrowerId, userId);

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
    }

    async createBorrow(body: CreateBorrowTransactionRequest, userId: number) {
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
                    userId
                }, t);

                // Update user's total balance
                await this.userService.increaseTotalBalance(userId, body.amount, t);

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

    async createBorrowWithTransaction(body: CreateBorrowTransactionRequest, userId: number, t: Transaction) {
        if (body.amount <= 0) {
            throw new BadRequestException('Transaction amount must be positive');
        }

        const sourceWallet = await this.walletService.findById(body.sourceWalletId, userId);
        const lender = await this.relatedUserService.findById(body.lenderId, userId);

        // Create the transaction record
        const transaction = await this.createGeneralTransaction({
            type: TransactionType.BORROW,
            ...body,
            categoryId: null,
            userId
        }, t);

        // Update user's total balance
        await this.userService.increaseTotalBalance(userId, body.amount, t);

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
    }

    /**
     * There are some important attrs and some not important attrs.
     * Important attrs are: amount, sourceWalletId, categoryId, transactionDate
     * Unimportant attrs are: description, image.
     *
     * Important attrs affect a lot of things, like user's total balance, wallet's balance, cache,...
     * We will have lots of cases to handle. That will easily make the code too long and hard to read.
     * And it also runs into errors.
     * So just simply remove the old transaction and create a new one.
     */
    async updateIncome(id: number, body: UpdateIncomeTransactionRequest, userId: number) {
        try {
            return await this.sequelize.transaction(async (t) => {
                await this.removeTransactionWithSTransaction(userId, id, t);

                const newTransaction = await this.createIncomeWithTransaction(
                    {...body},
                    userId,
                    t
                );

                return newTransaction.dataValues;
            });
        } catch (error) {
            throw new InternalServerErrorException("Failed to update transaction: " + error.message);
        }
    }

    /**
     * There are some important attrs and some not important attrs.
     * Important attrs are: amount, sourceWalletId, categoryId, transactionDate
     * Unimportant attrs are: description, image.
     *
     * Important attrs affect a lot of things, like user's total balance, wallet's balance, cache,...
     * We will have lots of cases to handle. That will easily make the code too long and hard to read.
     * And it also runs into errors.
     * So just simply remove the old transaction and create a new one.
     * @param id
     * @param body
     * @param userId
     */
    async updateExpense(id: number, body: UpdateExpenseTransactionRequest, userId: number) {
        try {
            return await this.sequelize.transaction(async (t) => {
                await this.removeTransactionWithSTransaction(userId, id, t);

                const newTransaction = await this.createExpenseWithTransaction(
                    {...body},
                    userId,
                    t
                );

                return newTransaction.dataValues;
            });
        } catch (error) {
            throw new InternalServerErrorException("Failed to update transaction: " + error.message);
        }
    }

    async updateLend(id: number, body: UpdateLendTransactionRequest, userId: number) {
        try {
            return await this.sequelize.transaction(async (t) => {
                await this.removeTransactionWithSTransaction(userId, id, t);

                const newTransaction = await this.createLendWithTransaction(
                    {...body},
                    userId,
                    t
                );

                return newTransaction.dataValues;
            });
        } catch (error) {
            throw new InternalServerErrorException("Failed to update transaction: " + error.message);
        }
    }

    async updateBorrow(id: number, body: UpdateBorrowTransactionRequest, userId: number) {
        try {
            return await this.sequelize.transaction(async (t) => {
                await this.removeTransactionWithSTransaction(userId, id, t);

                const newTransaction = await this.createBorrowWithTransaction(
                    {...body},
                    userId,
                    t
                );

                return newTransaction.dataValues;
            });
        } catch (error) {
            throw new InternalServerErrorException("Failed to update transaction: " + error.message);
        }
    }

    async removeTransaction(userId: number, transactionId: number){
        const transaction = await GeneralTransaction.findByPk(transactionId);

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        if (transaction.userId !== userId) {
            throw new BadRequestException('You are not allowed to edit this transaction');
        }

        try {
            const result = await this.sequelize.transaction(async (t) => {
                await this.statisticService.updateCacheAfterRemoveTransaction(transaction.userId, transaction);

                //case 1: income
                if (transaction.type === TransactionType.INCOME) {
                    await this.userService.decreaseTotalBalance(transaction.userId, transaction.amount, t);
                    await this.walletService.decreaseBalance(transaction.sourceWalletId, transaction.amount, t);
                }

                //case 2: expense
                if (transaction.type === TransactionType.EXPENSE) {
                    await this.userService.increaseTotalBalance(transaction.userId, transaction.amount, t);
                    await this.walletService.increaseBalance(transaction.sourceWalletId, transaction.amount, t);
                }

                //case 3: lend
                if (transaction.type === TransactionType.LEND) {
                    const lendTransaction = await LendTransaction.findOne({
                        where: {
                            generalTransactionId: transaction.id
                        }
                    });

                    await this.userService.increaseTotalBalance(transaction.userId, transaction.amount, t);
                    await this.walletService.increaseBalance(transaction.sourceWalletId, transaction.amount, t);
                    await this.userService.decreaseTotalLoan(transaction.userId, transaction.amount, t);
                    await this.relatedUserService.decreaseTotalDebt(lendTransaction.borrowerId, transaction.amount, t);

                    // Delete the lend transaction record
                    await lendTransaction.destroy({ transaction: t });
                }

                //case 4: borrow
                if (transaction.type === TransactionType.BORROW) {
                    const borrowTransaction = await BorrowTransaction.findOne({
                        where: {
                            generalTransactionId: transaction.id
                        }
                    });

                    await this.userService.decreaseTotalBalance(transaction.userId, transaction.amount, t);
                    await this.walletService.decreaseBalance(transaction.sourceWalletId, transaction.amount, t);
                    await this.userService.decreaseTotalDebt(transaction.userId, transaction.amount, t);
                    await this.relatedUserService.decreaseTotalLoan(borrowTransaction.lenderId, transaction.amount, t);

                    // Delete the borrow transaction record
                    await borrowTransaction.destroy({ transaction: t });
                }

                //case 5: transfer
                if (transaction.type === TransactionType.TRANSFER) {
                    const transferTransaction = await TransferTransaction.findOne({
                        where: {
                            generalTransactionId: transaction.id
                        }
                    });

                    await this.walletService.increaseBalance(transaction.sourceWalletId, transaction.amount, t);
                    await this.walletService.decreaseBalance(transferTransaction.destinationWalletId, transaction.amount, t);
                }

                // Delete the transaction record
                await transaction.destroy({ transaction: t });
            });

            return {
                result: true
            }
        } catch (error) {
            throw new InternalServerErrorException("Failed to delete transaction: " + error.message);
        }
    }

    async removeTransactionWithSTransaction(userId: number, transactionId: number, t: Transaction){
        const transaction = await GeneralTransaction.findByPk(transactionId);

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        if (transaction.userId !== userId) {
            throw new BadRequestException('You are not allowed to edit this transaction');
        }

        await this.statisticService.updateCacheAfterRemoveTransaction(transaction.userId, transaction);

        //case 1: income
        if (transaction.type === TransactionType.INCOME) {
            await this.userService.decreaseTotalBalance(transaction.userId, transaction.amount, t);
            await this.walletService.decreaseBalance(transaction.sourceWalletId, transaction.amount, t);
        }

        //case 2: expense
        if (transaction.type === TransactionType.EXPENSE) {
            await this.userService.increaseTotalBalance(transaction.userId, transaction.amount, t);
            await this.walletService.increaseBalance(transaction.sourceWalletId, transaction.amount, t);
        }

        //case 3: lend
        if (transaction.type === TransactionType.LEND) {
            const lendTransaction = await LendTransaction.findOne({
                where: {
                    generalTransactionId: transaction.id
                }
            });

            await this.userService.increaseTotalBalance(transaction.userId, transaction.amount, t);
            await this.walletService.increaseBalance(transaction.sourceWalletId, transaction.amount, t);
            await this.userService.decreaseTotalLoan(transaction.userId, transaction.amount, t);
            await this.relatedUserService.decreaseTotalDebt(lendTransaction.borrowerId, transaction.amount, t);

            // Delete the lend transaction record
            await lendTransaction.destroy({ transaction: t });
        }

        //case 4: borrow
        if (transaction.type === TransactionType.BORROW) {
            const borrowTransaction = await BorrowTransaction.findOne({
                where: {
                    generalTransactionId: transaction.id
                }
            });

            await this.userService.decreaseTotalBalance(transaction.userId, transaction.amount, t);
            await this.walletService.decreaseBalance(transaction.sourceWalletId, transaction.amount, t);
            await this.userService.decreaseTotalDebt(transaction.userId, transaction.amount, t);
            await this.relatedUserService.decreaseTotalLoan(borrowTransaction.lenderId, transaction.amount, t);

            // Delete the borrow transaction record
            await borrowTransaction.destroy({ transaction: t });
        }

        //case 5: transfer
        if (transaction.type === TransactionType.TRANSFER) {
            const transferTransaction = await TransferTransaction.findOne({
                where: {
                    generalTransactionId: transaction.id
                }
            });

            await this.walletService.increaseBalance(transaction.sourceWalletId, transaction.amount, t);
            await this.walletService.decreaseBalance(transferTransaction.destinationWalletId, transaction.amount, t);
        }

        // Delete the transaction record
        await transaction.destroy({ transaction: t });
    }
}