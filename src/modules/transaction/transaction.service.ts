import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";
import { BorrowTransaction, GeneralTransaction, LendTransaction, ModifyBalanceTransaction, TransferTransaction } from "src/database/models";
import { TransactionType } from "src/shared/enums/transaction";
import { CreateGeneralTrans } from "src/shared/types/transactions/general";
import {
    CreateBorrowTransactionRequest,
    CreateGeneralTransactionRequest, CreateLendTransactionRequest,
    CreateModifyBalanceTransactionRequest,
    CreateTransferTransactionRequest,
    GetAllTransactionsRequest, UpdateBorrowTransactionRequest, UpdateExpenseTransactionRequest,
    UpdateIncomeTransactionRequest, UpdateLendTransactionRequest,
    UpdateModifyBalanceTransactionRequest,
    UpdateTransferTransactionRequest
} from "./transaction.dto";
import { UserService } from "../user/user.service";
import { WalletService } from "../wallet/wallet.service";
import { CategoryService } from "../category/category.service";
import { CategoryType } from "src/shared/enums/category";
import { RelatedUserService } from "../related-user/related-user.service";
import { Op, Transaction, WhereOptions } from "sequelize";
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
    ) { }

    async getTransactionById(userId: number, transactionId: number) {
        const transaction = await GeneralTransaction.findOne({
            where: {
                id: transactionId,
                userId: userId
            },
        });

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        let extraInfo = {};

        if (transaction.type == TransactionType.LEND) {
            extraInfo = await LendTransaction.findOne({
                where: {
                    generalTransactionId: transaction.id
                },
                raw: true
            })
        } else if (transaction.type == TransactionType.BORROW) {
            extraInfo = await BorrowTransaction.findOne({
                where: {
                    generalTransactionId: transaction.id
                },
                raw: true
            })
        } else if (transaction.type == TransactionType.TRANSFER) {
            extraInfo = await TransferTransaction.findOne({
                where: {
                    generalTransactionId: transaction.id
                },
                raw: true
            })
        }


        return {
            ...transaction.dataValues,
            extraInfo,
        };
    }

    async getAllTransactions(userId: number) {
        const where: WhereOptions<GeneralTransaction> = {
            userId: userId,
        };


        const transactions = await GeneralTransaction.findAll({
            where,
            include: [
                {
                    model: LendTransaction,
                    required: false,
                    attributes: ['borrowerId', 'collectionDate', 'collectedAmount']
                },
                {
                    model: BorrowTransaction,
                    required: false,
                    attributes: ['lenderId', 'repaymentDate', 'repaymentAmount']
                },
                {
                    model: TransferTransaction,
                    required: false,
                    attributes: ['destinationWalletId']
                },
                {
                    model: ModifyBalanceTransaction,
                    required: false,
                    attributes: ['newRealBalance']
                }
            ],
            order: [['transactionDate', 'DESC']],
        });

        // Transform data để tạo extraInfo
        return transactions.map(transaction => {
            const data = transaction.toJSON();
            let extraInfo = null;

            switch (data.type) {
                case 'LEND':
                    if (data.lendTransaction) {
                        extraInfo = {
                            borrowerId: data.lendTransaction.borrowerId,
                            collectionDate: data.lendTransaction.collectionDate,
                            collectedAmount: data.lendTransaction.collectedAmount
                        };
                    }
                    break;
                case 'BORROW':
                    if (data.borrowTransaction) {
                        extraInfo = {
                            lenderId: data.borrowTransaction.lenderId,
                            repaymentDate: data.borrowTransaction.repaymentDate,
                            repaymentAmount: data.borrowTransaction.repaymentAmount
                        };
                    }
                    break;
                case 'TRANSFER':
                    if (data.transferTransaction) {
                        extraInfo = {
                            destinationWalletId: data.transferTransaction.destinationWalletId
                        };
                    }
                    break;
                case 'MODIFY_BALANCE':
                    if (data.modifyBalanceTransaction) {
                        extraInfo = {
                            newRealBalance: data.modifyBalanceTransaction.newRealBalance
                        };
                    }
                    break;
            }

            // Remove nested objects và add extraInfo
            delete data.lendTransaction;
            delete data.borrowTransaction;
            delete data.transferTransaction;
            delete data.modifyBalanceTransaction;

            return { ...data, extraInfo };
        });
    }


    async getTransactions(userId: number, query: GetAllTransactionsRequest) {
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

        // await this.statisticService.updateCacheAfterCreateTransaction(params.userId, transaction);

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

                const mostSoonModifyBalanceTransaction = await this.getMostSoonModifyBalanceTransactionAfterDate(
                    userId,
                    body.sourceWalletId,
                    body.transactionDate,
                    t
                );

                if (mostSoonModifyBalanceTransaction) {
                    // Update the most soon modify balance transaction
                    await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransaction, t);
                } else {
                    // Update user's total balance
                    await this.userService.increaseTotalBalance(userId, body.amount, t);

                    // Update wallet balance
                    await this.walletService.increaseBalance(body.sourceWalletId, body.amount, t);
                }

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

        const mostSoonModifyBalanceTransaction = await this.getMostSoonModifyBalanceTransactionAfterDate(
            userId,
            body.sourceWalletId,
            body.transactionDate,
            t
        );

        if (mostSoonModifyBalanceTransaction) {
            // Update the most soon modify balance transaction
            await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransaction, t);
        } else {
            // Update user's total balance
            await this.userService.increaseTotalBalance(userId, body.amount, t);

            // Update wallet balance
            await this.walletService.increaseBalance(body.sourceWalletId, body.amount, t);
        }

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

                const mostSoonModifyBalanceTransaction = await this.getMostSoonModifyBalanceTransactionAfterDate(
                    userId,
                    body.sourceWalletId,
                    body.transactionDate,
                    t
                );

                if (mostSoonModifyBalanceTransaction) {
                    // Update the most soon modify balance transaction
                    await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransaction, t);
                } else {
                    // Update user's total balance
                    await this.userService.decreaseTotalBalance(userId, body.amount, t);

                    // Update wallet balance
                    await this.walletService.decreaseBalance(body.sourceWalletId, body.amount, t);
                }

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

        const mostSoonModifyBalanceTransaction = await this.getMostSoonModifyBalanceTransactionAfterDate(
            userId,
            body.sourceWalletId,
            body.transactionDate,
            t
        );

        if (mostSoonModifyBalanceTransaction) {
            // Update the most soon modify balance transaction
            await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransaction, t);
        } else {
            // Update user's total balance
            await this.userService.decreaseTotalBalance(userId, body.amount, t);

            // Update wallet balance
            await this.walletService.decreaseBalance(body.sourceWalletId, body.amount, t);
        }

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

                const mostSoonModifyBalanceTransactionOfSourceWallet = await this.getMostSoonModifyBalanceTransactionAfterDate(
                    userId,
                    body.sourceWalletId,
                    body.transactionDate,
                    t
                );

                const mostSoonModifyBalanceTransactionOfDestinationWallet = await this.getMostSoonModifyBalanceTransactionAfterDate(
                    userId,
                    body.destinationWalletId,
                    body.transactionDate,
                    t
                );

                if (!mostSoonModifyBalanceTransactionOfSourceWallet && !mostSoonModifyBalanceTransactionOfDestinationWallet) {
                    // If both wallets do not have a most soon modify balance transaction, we can safely update the balances
                    await this.walletService.decreaseBalance(body.sourceWalletId, body.amount, t);
                    await this.walletService.increaseBalance(body.destinationWalletId, body.amount, t);
                } else if (mostSoonModifyBalanceTransactionOfSourceWallet && !mostSoonModifyBalanceTransactionOfDestinationWallet) {
                    await this.userService.increaseTotalBalance(userId, body.amount, t);

                    await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransactionOfSourceWallet, t);
                    await this.walletService.increaseBalance(body.destinationWalletId, body.amount, t);
                } else if (!mostSoonModifyBalanceTransactionOfSourceWallet && mostSoonModifyBalanceTransactionOfDestinationWallet) {
                    await this.userService.decreaseTotalBalance(userId, body.amount, t);

                    await this.walletService.decreaseBalance(body.sourceWalletId, body.amount, t);
                    await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransactionOfDestinationWallet, t);
                } else if (mostSoonModifyBalanceTransactionOfSourceWallet && mostSoonModifyBalanceTransactionOfDestinationWallet) {
                    await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransactionOfSourceWallet, t);
                    await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransactionOfDestinationWallet, t);
                }


                await TransferTransaction.create({
                    generalTransactionId: transaction.id,
                    destinationWalletId: body.destinationWalletId
                }, { transaction: t });

                return transaction;
            });

            return {
                ...result.dataValues,
                extraInfo: {
                    destinationWalletId: body.destinationWalletId,
                }
            };
        } catch (error) {
            throw new BadRequestException(`Failed to create transfer transaction: ${error.message}`);
        }
    }

    async createTransferWithTransaction(body: CreateTransferTransactionRequest, userId: number, t: Transaction) {
        if (body.amount <= 0) {
            throw new BadRequestException('Transaction amount must be positive');
        }

        const sourceWallet = await this.walletService.findById(body.sourceWalletId, userId);
        const destinationWallet = await this.walletService.findById(body.destinationWalletId, userId);
        if (sourceWallet.id === destinationWallet.id) {
            throw new BadRequestException('Source wallet and destination wallet must be different');
        }
        // Create the transaction record
        const transaction = await this.createGeneralTransaction({
            type: TransactionType.TRANSFER,
            ...body,
            categoryId: null,
            userId
        }, t);


        const mostSoonModifyBalanceTransactionOfSourceWallet = await this.getMostSoonModifyBalanceTransactionAfterDate(
            userId,
            body.sourceWalletId,
            body.transactionDate,
            t
        );

        const mostSoonModifyBalanceTransactionOfDestinationWallet = await this.getMostSoonModifyBalanceTransactionAfterDate(
            userId,
            body.destinationWalletId,
            body.transactionDate,
            t
        );

        if (!mostSoonModifyBalanceTransactionOfSourceWallet && !mostSoonModifyBalanceTransactionOfDestinationWallet) {
            // If both wallets do not have a most soon modify balance transaction, we can safely update the balances
            await this.walletService.decreaseBalance(body.sourceWalletId, body.amount, t);
            await this.walletService.increaseBalance(body.destinationWalletId, body.amount, t);
        } else if (mostSoonModifyBalanceTransactionOfSourceWallet && !mostSoonModifyBalanceTransactionOfDestinationWallet) {
            await this.userService.increaseTotalBalance(userId, body.amount, t);

            await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransactionOfSourceWallet, t);
            await this.walletService.increaseBalance(body.destinationWalletId, body.amount, t);
        } else if (!mostSoonModifyBalanceTransactionOfSourceWallet && mostSoonModifyBalanceTransactionOfDestinationWallet) {
            await this.userService.decreaseTotalBalance(userId, body.amount, t);

            await this.walletService.decreaseBalance(body.sourceWalletId, body.amount, t);
            await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransactionOfDestinationWallet, t);
        } else if (mostSoonModifyBalanceTransactionOfSourceWallet && mostSoonModifyBalanceTransactionOfDestinationWallet) {
            await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransactionOfSourceWallet, t);
            await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransactionOfDestinationWallet, t);
        }

        await TransferTransaction.create({
            generalTransactionId: transaction.id,
            destinationWalletId: body.destinationWalletId
        }, { transaction: t });

        return transaction;
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

                const mostSoonModifyBalanceTransaction = await this.getMostSoonModifyBalanceTransactionAfterDate(
                    userId,
                    body.sourceWalletId,
                    body.transactionDate,
                    t
                );

                if (mostSoonModifyBalanceTransaction) {
                    // Update the most soon modify balance transaction
                    await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransaction, t);
                } else {
                    // Update wallet balance
                    await this.walletService.decreaseBalance(body.sourceWalletId, body.amount, t);
                }

                // Update user's total loan
                await this.userService.increaseTotalLoan(userId, body.amount, t);

                // Update borrower's total debt
                await this.relatedUserService.increaseTotalDebt(body.borrowerId, body.amount, t);

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
                extraInfo: {
                    borrowerId: body.borrowerId,
                }
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
            userId
        }, t);

        const mostSoonModifyBalanceTransaction = await this.getMostSoonModifyBalanceTransactionAfterDate(
            userId,
            body.sourceWalletId,
            body.transactionDate,
            t
        );

        if (mostSoonModifyBalanceTransaction) {
            // Update the most soon modify balance transaction
            await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransaction, t);
        } else {
            // Update wallet balance
            await this.walletService.decreaseBalance(body.sourceWalletId, body.amount, t);
        }

        // Update user's total loan
        await this.userService.increaseTotalLoan(userId, body.amount, t);

        // Update borrower's total debt
        await this.relatedUserService.increaseTotalDebt(body.borrowerId, body.amount, t);

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

                const mostSoonModifyBalanceTransaction = await this.getMostSoonModifyBalanceTransactionAfterDate(
                    userId,
                    body.sourceWalletId,
                    body.transactionDate,
                    t
                );

                if (mostSoonModifyBalanceTransaction) {
                    // Update the most soon modify balance transaction
                    await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransaction, t);
                } else {
                    // Update source wallet balance
                    await this.walletService.increaseBalance(body.sourceWalletId, body.amount, t);
                }

                // Update user's total debt
                await this.userService.increaseTotalDebt(userId, body.amount, t);

                // Update lender's total loan
                await this.relatedUserService.increaseTotalLoan(body.lenderId, body.amount, t);

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
                extraInfo: {
                    lenderId: body.lenderId,
                },
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
            userId
        }, t);

        const mostSoonModifyBalanceTransaction = await this.getMostSoonModifyBalanceTransactionAfterDate(
            userId,
            body.sourceWalletId,
            body.transactionDate,
            t
        );

        if (mostSoonModifyBalanceTransaction) {
            // Update the most soon modify balance transaction
            await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransaction, t);
        } else {
            // Update source wallet balance
            await this.walletService.increaseBalance(body.sourceWalletId, body.amount, t);
        }

        // Update user's total debt
        await this.userService.increaseTotalDebt(userId, body.amount, t);

        // Update lender's total loan
        await this.relatedUserService.increaseTotalLoan(body.lenderId, body.amount, t);

        //add extra info to table
        await BorrowTransaction.create({
            generalTransactionId: transaction.id,
            lenderId: body.lenderId,
            repaymentDate: body.repaymentDate,
            repaymentAmount: 0
        }, { transaction: t });

        return transaction;
    }

    async createModifyBalance(body: CreateModifyBalanceTransactionRequest, userId: number) {
        const wallet = await this.walletService.findById(body.sourceWalletId, userId);

        //cho nay can la balance cua wallet tai thoi diem cua giao dich nay
        //=> can phai tinh toan tu lan dieu chinh so du gan nhat
        const oldBalance = await this.calculateBalanceAtDate(userId, body.sourceWalletId, new Date(body.transactionDate));

        const differ = body.newRealBalance - oldBalance;
        if (differ <= 0) {
            //category must be expense category
            const category = await this.categoryService.findById(body.categoryId, userId);
            if (category.type !== CategoryType.EXPENSE) {
                throw new BadRequestException('Invalid category type for modify balance transaction');
            }
        } else {
            //category must be income category
            const category = await this.categoryService.findById(body.categoryId, userId);
            if (category.type !== CategoryType.INCOME) {
                throw new BadRequestException('Invalid category type for modify balance transaction');
            }
        }

        try {
            return await this.sequelize.transaction(async (t) => {
                // Create the transaction record
                const transaction = await this.createGeneralTransaction({
                    type: TransactionType.MODIFY_BALANCE,
                    amount: differ,
                    ...body,
                    userId
                }, t);

                const mostSoonModifyBalanceTransaction = await this.getMostSoonModifyBalanceTransactionAfterDate(
                    userId,
                    body.sourceWalletId,
                    body.transactionDate,
                    t
                );

                if (mostSoonModifyBalanceTransaction) {
                    // Update the most soon modify balance transaction
                    await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransaction, t);
                } else {
                    // If there is no most soon modify balance transaction, we can safely update the wallet balance
                    await this.walletService.setBalance(body.sourceWalletId, body.newRealBalance, t);

                    // Update user's total balance
                    if (differ > 0) {
                        await this.userService.increaseTotalBalance(userId, differ, t);
                    } else {
                        await this.userService.decreaseTotalBalance(userId, -differ, t);
                    }
                }

                // Create modify balance transaction record
                await ModifyBalanceTransaction.create({
                    generalTransactionId: transaction.id,
                    newRealBalance: body.newRealBalance
                }, { transaction: t });

                return {
                    ...transaction.dataValues,
                    extraInfo: {
                        newRealBalance: body.newRealBalance,
                    },
                };
            });
        } catch (error) {
            throw new BadRequestException(`Failed to create modify balance transaction: ${error.message}`);
        }
    }

    async createModifyBalanceWithTransaction(body: CreateModifyBalanceTransactionRequest, userId: number, t: Transaction) {
        const wallet = await this.walletService.findById(body.sourceWalletId, userId);

        //cho nay can la balance cua wallet tai thoi diem cua giao dich nay
        //=> can phai tinh toan tu lan dieu chinh so du gan nhat
        const oldBalance = await this.calculateBalanceAtDate(userId, body.sourceWalletId, new Date(body.transactionDate));

        const differ = body.newRealBalance - oldBalance;
        if (differ <= 0) {
            //category must be expense category
            const category = await this.categoryService.findById(body.categoryId, userId);
            if (category.type !== CategoryType.EXPENSE) {
                throw new BadRequestException('Invalid category type for modify balance transaction');
            }
        } else {
            //category must be income category
            const category = await this.categoryService.findById(body.categoryId, userId);
            if (category.type !== CategoryType.INCOME) {
                throw new BadRequestException('Invalid category type for modify balance transaction');
            }
        }

        // Create the transaction record
        const transaction = await this.createGeneralTransaction({
            type: TransactionType.MODIFY_BALANCE,
            amount: differ,
            ...body,
            userId
        }, t);

        const mostSoonModifyBalanceTransaction = await this.getMostSoonModifyBalanceTransactionAfterDate(
            userId,
            body.sourceWalletId,
            body.transactionDate,
            t
        );

        if (mostSoonModifyBalanceTransaction) {
            // Update the most soon modify balance transaction
            await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransaction, t);
        } else {
            // If there is no most soon modify balance transaction, we can safely update the wallet balance
            await this.walletService.setBalance(body.sourceWalletId, body.newRealBalance, t);

            // Update user's total balance
            if (differ > 0) {
                await this.userService.increaseTotalBalance(userId, differ, t);
            } else {
                await this.userService.decreaseTotalBalance(userId, -differ, t);
            }
        }

        // Create modify balance transaction record
        await ModifyBalanceTransaction.create({
            generalTransactionId: transaction.id,
            newRealBalance: body.newRealBalance
        }, { transaction: t });

        return transaction;
    }


    /**
     * this function must be called after other transaction types are created.
     * It is used to sync the modify balance transaction with the general transaction.
     * @param transaction 
     * @param t 
     */
    async updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction: GeneralTransaction, mostSoonModifyBalanceTransaction: GeneralTransaction, t: Transaction) {
        const oldDiff = mostSoonModifyBalanceTransaction.amount;
        let newDiff: number;

        if (transaction.type === TransactionType.INCOME) {
            newDiff = oldDiff - transaction.amount;
        } else if (transaction.type === TransactionType.EXPENSE) {
            newDiff = oldDiff + transaction.amount;
        } else if (transaction.type === TransactionType.TRANSFER) {
            if (transaction.sourceWalletId === mostSoonModifyBalanceTransaction.sourceWalletId) {
                newDiff = oldDiff + transaction.amount; // transfer out
            } else {
                newDiff = oldDiff - transaction.amount; // transfer in
            }
        } else if (transaction.type === TransactionType.LEND) {
            newDiff = oldDiff + transaction.amount; // lend out
        } else if (transaction.type === TransactionType.BORROW) {
            newDiff = oldDiff - transaction.amount; // borrow in
        } else if (transaction.type === TransactionType.MODIFY_BALANCE) {
            newDiff = oldDiff - transaction.amount; // modify balance
        }


        if (oldDiff <= 0 && newDiff > 0) {
            //It means that change from expense to income
            const otherIncomeCategory = await this.categoryService.findOtherIncomeCategory(transaction.userId);

            await mostSoonModifyBalanceTransaction.update({
                categoryId: otherIncomeCategory.id,
                amount: newDiff
            }, { transaction: t });
        } else if (oldDiff > 0 && newDiff <= 0) {
            //It means that change from income to expense
            const otherExpenseCategory = await this.categoryService.findOtherExpenseCategory(transaction.userId);

            await mostSoonModifyBalanceTransaction.update({
                categoryId: otherExpenseCategory.id,
                amount: newDiff
            }, { transaction: t });
        } else {
            //normal case, just update the amount
            await mostSoonModifyBalanceTransaction.update({
                amount: newDiff
            }, { transaction: t });
        }
    }

    async updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction: GeneralTransaction, mostSoonModifyBalanceTransaction: GeneralTransaction, t: Transaction) {
        const oldDiff = mostSoonModifyBalanceTransaction.amount;
        let newDiff: number;

        if (transaction.type === TransactionType.INCOME) {
            newDiff = oldDiff + transaction.amount;
        } else if (transaction.type === TransactionType.EXPENSE) {
            newDiff = oldDiff - transaction.amount;
        } else if (transaction.type === TransactionType.TRANSFER) {
            if (transaction.sourceWalletId === mostSoonModifyBalanceTransaction.sourceWalletId) {
                newDiff = oldDiff - transaction.amount; // transfer out
            } else {
                newDiff = oldDiff + transaction.amount; // transfer in
            }
        } else if (transaction.type === TransactionType.LEND) {
            newDiff = oldDiff - transaction.amount; // lend out
        } else if (transaction.type === TransactionType.BORROW) {
            newDiff = oldDiff + transaction.amount; // borrow in
        } else if (transaction.type === TransactionType.MODIFY_BALANCE) {
            newDiff = oldDiff + transaction.amount; // modify balance
        }

        if (oldDiff <= 0 && newDiff > 0) {
            //It means that change from expense to income
            const otherIncomeCategory = await this.categoryService.findOtherIncomeCategory(transaction.userId);

            await mostSoonModifyBalanceTransaction.update({
                categoryId: otherIncomeCategory.id,
                amount: newDiff
            }, { transaction: t });
        } else if (oldDiff > 0 && newDiff <= 0) {
            //It means that change from income to expense
            const otherExpenseCategory = await this.categoryService.findOtherExpenseCategory(transaction.userId);

            await mostSoonModifyBalanceTransaction.update({
                categoryId: otherExpenseCategory.id,
                amount: newDiff
            }, { transaction: t });
        } else {
            //normal case, just update the amount
            await mostSoonModifyBalanceTransaction.update({
                amount: newDiff
            }, { transaction: t });
        }
    }

    async getLatestModifyBalanceTransactionAtDate(
        userId: number,
        sourceWalletId: number,
        date: Date,
        t?: Transaction
    ) {
        const transaction = await GeneralTransaction.findOne(
            {
                where: {
                    userId: userId,
                    sourceWalletId: sourceWalletId,
                    type: TransactionType.MODIFY_BALANCE,
                    transactionDate: {
                        [Op.lt]: date // less than or equal to the given date
                    }
                },
                include: [{
                    model: ModifyBalanceTransaction,
                    required: true,
                    attributes: ['newRealBalance']
                }],
                order: [['transactionDate', 'DESC']], // descending to get the latest one
                transaction: t
            }
        )

        return transaction ? transaction : null;
    }

    async getMostSoonModifyBalanceTransactionAfterDate(
        userId: number,
        sourceWalletId: number,
        date: string | Date,
        t?: Transaction
    ) {
        const transaction = await GeneralTransaction.findOne(
            {
                where: {
                    userId: userId,
                    sourceWalletId: sourceWalletId,
                    type: TransactionType.MODIFY_BALANCE,
                    transactionDate: {
                        [Op.gt]: date // greater than the given date
                    }
                },
                include: [{
                    model: ModifyBalanceTransaction,
                    required: true,
                    attributes: ['newRealBalance']
                }],
                order: [['transactionDate', 'ASC']], // ascending to get the nearest one after
                transaction: t
            }
        )

        return transaction ? transaction : null;
    }

    async calculateBalanceAtDate(
        userId: number,
        sourceWalletId: number,
        date: Date
    ) {
        let balance = 0;

        const latestModifyBalanceTransaction = await this.getLatestModifyBalanceTransactionAtDate(
            userId,
            sourceWalletId,
            date
        );

        if (latestModifyBalanceTransaction != null) {
            balance = latestModifyBalanceTransaction.modifyBalanceTransaction.newRealBalance;
        }


        //GET ALL RELATED TRANSACTIONS
        const where: WhereOptions<GeneralTransaction> = {
            userId: userId,
            [Op.or]: [
                // Transactions with this wallet as source
                { sourceWalletId: sourceWalletId },
                // Transfer transactions with this wallet as destination
                {
                    type: TransactionType.TRANSFER,
                    '$transferTransaction.destinationWalletId$': sourceWalletId
                }
            ],
            transactionDate: {
                [Op.lt]: date
            },
        };

        if (latestModifyBalanceTransaction) {
            where['transactionDate'] = {
                [Op.lt]: date,
                [Op.gte]: latestModifyBalanceTransaction.transactionDate
            };
        }

        const recentTransactionsFromLatestModifyBalance = await GeneralTransaction.findAll({
            where,
            include: [
                {
                    model: TransferTransaction,
                    required: false,
                    attributes: ['destinationWalletId']
                }
            ],
            order: [['transactionDate', 'ASC']],
            raw: true
        });

        for (const transaction of recentTransactionsFromLatestModifyBalance) {
            if (transaction.type === TransactionType.INCOME) {
                balance += transaction.amount;
            } else if (transaction.type === TransactionType.EXPENSE) {
                balance -= transaction.amount;
            } else if (transaction.type === TransactionType.TRANSFER) {
                if (transaction.sourceWalletId === sourceWalletId) {
                    balance -= transaction.amount; // transfer out
                } else {
                    balance += transaction.amount; // transfer in
                }
            } else if (transaction.type === TransactionType.LEND) {
                balance -= transaction.amount; // lend out
            } else if (transaction.type === TransactionType.BORROW) {
                balance += transaction.amount; // borrow in
            }
        }

        return balance;
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
                    { ...body },
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
                    { ...body },
                    userId,
                    t
                );

                return newTransaction.dataValues;
            });
        } catch (error) {
            throw new InternalServerErrorException("Failed to update transaction: " + error.message);
        }
    }

    async updateTransfer(id: number, body: UpdateTransferTransactionRequest, userId: number) {
        try {
            return await this.sequelize.transaction(async (t) => {
                await this.removeTransactionWithSTransaction(userId, id, t);

                const newTransaction = await this.createTransferWithTransaction(
                    { ...body },
                    userId,
                    t
                );

                return {
                    ...newTransaction.dataValues,
                    extraInfo: {
                        destinationWalletId: body.destinationWalletId,
                    }
                };
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
                    { ...body },
                    userId,
                    t
                );

                return {
                    ...newTransaction.dataValues,
                    extraInfo: {
                        borrowerId: body.borrowerId,
                    }
                }
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
                    { ...body },
                    userId,
                    t
                );

                return {
                    ...newTransaction.dataValues,
                    extraInfo: {
                        lenderId: body.lenderId,
                    }
                };
            });
        } catch (error) {
            throw new InternalServerErrorException("Failed to update transaction: " + error.message);
        }
    }

    async updateModifyBalance(id: number, body: UpdateModifyBalanceTransactionRequest, userId: number) {
        try {
            return await this.sequelize.transaction(async (t) => {
                await this.removeTransactionWithSTransaction(userId, id, t);

                const newTransaction = await this.createModifyBalanceWithTransaction(
                    { ...body },
                    userId,
                    t
                );

                return {
                    ...newTransaction.dataValues,
                    extraInfo: {
                        newRealBalance: body.newRealBalance,
                    }
                };
            });
        } catch (error) {
            throw new InternalServerErrorException("Failed to update transaction: " + error.message);
        }
    }

    async removeTransaction(userId: number, transactionId: number) {
        const transaction = await GeneralTransaction.findByPk(transactionId);

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        if (transaction.userId !== userId) {
            throw new BadRequestException('You are not allowed to edit this transaction');
        }

        try {
            const result = await this.sequelize.transaction(async (t) => {
                // await this.statisticService.updateCacheAfterRemoveTransaction(transaction.userId, transaction);

                const mostSoonModifyBalanceTransaction = await this.getMostSoonModifyBalanceTransactionAfterDate(
                    transaction.userId,
                    transaction.sourceWalletId,
                    new Date(transaction.transactionDate),
                    t
                );

                //case 1: income
                if (transaction.type === TransactionType.INCOME) {
                    if (mostSoonModifyBalanceTransaction) {
                        await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransaction, t);
                    } else {
                        await this.userService.decreaseTotalBalance(transaction.userId, transaction.amount, t);
                        await this.walletService.decreaseBalance(transaction.sourceWalletId, transaction.amount, t);
                    }
                }

                //case 2: expense
                if (transaction.type === TransactionType.EXPENSE) {
                    if (mostSoonModifyBalanceTransaction) {
                        await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransaction, t);
                    } else {
                        await this.userService.increaseTotalBalance(transaction.userId, transaction.amount, t);
                        await this.walletService.increaseBalance(transaction.sourceWalletId, transaction.amount, t);
                    }
                }

                //case 3: lend
                if (transaction.type === TransactionType.LEND) {
                    const lendTransaction = await LendTransaction.findOne({
                        where: {
                            generalTransactionId: transaction.id
                        }
                    });

                    if (mostSoonModifyBalanceTransaction) {
                        await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransaction, t);
                    } else {
                        await this.walletService.increaseBalance(transaction.sourceWalletId, transaction.amount, t);
                    }

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

                    if (mostSoonModifyBalanceTransaction) {
                        await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransaction, t);
                    } else {
                        await this.walletService.decreaseBalance(transaction.sourceWalletId, transaction.amount, t);
                    }

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

                    const mostSoonModifyBalanceTransactionOfSourceWallet = await this.getMostSoonModifyBalanceTransactionAfterDate(
                        transaction.userId,
                        transaction.sourceWalletId,
                        new Date(transaction.transactionDate),
                        t
                    );

                    const mostSoonModifyBalanceTransactionOfDestinationWallet = await this.getMostSoonModifyBalanceTransactionAfterDate(
                        transaction.userId,
                        transferTransaction.destinationWalletId,
                        new Date(transaction.transactionDate),
                        t
                    );

                    if (!mostSoonModifyBalanceTransactionOfSourceWallet && !mostSoonModifyBalanceTransactionOfDestinationWallet) {
                        // If both wallets do not have a most soon modify balance transaction, we can safely update the balances
                        await this.walletService.increaseBalance(transaction.sourceWalletId, transaction.amount, t);
                        await this.walletService.decreaseBalance(transferTransaction.destinationWalletId, transaction.amount, t);
                    } else if (mostSoonModifyBalanceTransactionOfSourceWallet && !mostSoonModifyBalanceTransactionOfDestinationWallet) {
                        await this.userService.decreaseTotalBalance(userId, transaction.amount, t);

                        await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransactionOfSourceWallet, t);
                        await this.walletService.decreaseBalance(transferTransaction.destinationWalletId, transaction.amount, t);
                    } else if (!mostSoonModifyBalanceTransactionOfSourceWallet && mostSoonModifyBalanceTransactionOfDestinationWallet) {
                        await this.userService.increaseTotalBalance(userId, transaction.amount, t);

                        await this.walletService.increaseBalance(transaction.sourceWalletId, transaction.amount, t);
                        await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransactionOfDestinationWallet, t);
                    } else if (mostSoonModifyBalanceTransactionOfSourceWallet && mostSoonModifyBalanceTransactionOfDestinationWallet) {
                        await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransactionOfSourceWallet, t);
                        await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransactionOfDestinationWallet, t);
                    }

                    await transferTransaction.destroy({ transaction: t });
                }

                // case 6: modify balance
                if (transaction.type === TransactionType.MODIFY_BALANCE) {
                    const modifyBalanceTransaction = await ModifyBalanceTransaction.findOne({
                        where: {
                            generalTransactionId: transaction.id
                        }
                    });

                    if (mostSoonModifyBalanceTransaction) {
                        await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransaction, t);
                    } else {
                        const differ = transaction.amount;

                        if (differ > 0) {
                            await this.walletService.decreaseBalance(transaction.sourceWalletId, differ, t);
                            await this.userService.decreaseTotalBalance(userId, differ, t);
                        } else {
                            await this.walletService.increaseBalance(transaction.sourceWalletId, -differ, t);
                            await this.userService.increaseTotalBalance(userId, -differ, t);
                        }
                    }

                    // Delete the modify balance transaction record
                    await modifyBalanceTransaction.destroy({ transaction: t });
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

    async removeTransactionWithSTransaction(userId: number, transactionId: number, t: Transaction) {
        const transaction = await GeneralTransaction.findByPk(transactionId);

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        if (transaction.userId !== userId) {
            throw new BadRequestException('You are not allowed to edit this transaction');
        }

        // await this.statisticService.updateCacheAfterRemoveTransaction(transaction.userId, transaction);

        const mostSoonModifyBalanceTransaction = await this.getMostSoonModifyBalanceTransactionAfterDate(
            transaction.userId,
            transaction.sourceWalletId,
            new Date(transaction.transactionDate),
            t
        );

        //case 1: income
        if (transaction.type === TransactionType.INCOME) {
            if (mostSoonModifyBalanceTransaction) {
                await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransaction, t);
            } else {
                await this.userService.decreaseTotalBalance(transaction.userId, transaction.amount, t);
                await this.walletService.decreaseBalance(transaction.sourceWalletId, transaction.amount, t);
            }
        }

        //case 2: expense
        if (transaction.type === TransactionType.EXPENSE) {
            if (mostSoonModifyBalanceTransaction) {
                await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransaction, t);
            } else {
                await this.userService.increaseTotalBalance(transaction.userId, transaction.amount, t);
                await this.walletService.increaseBalance(transaction.sourceWalletId, transaction.amount, t);
            }
        }

        //case 3: lend
        if (transaction.type === TransactionType.LEND) {
            const lendTransaction = await LendTransaction.findOne({
                where: {
                    generalTransactionId: transaction.id
                }
            });

            if (mostSoonModifyBalanceTransaction) {
                await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransaction, t);
            } else {
                await this.walletService.increaseBalance(transaction.sourceWalletId, transaction.amount, t);
            }

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

            if (mostSoonModifyBalanceTransaction) {
                await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransaction, t);
            } else {
                await this.walletService.decreaseBalance(transaction.sourceWalletId, transaction.amount, t);
            }

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

            const mostSoonModifyBalanceTransactionOfSourceWallet = await this.getMostSoonModifyBalanceTransactionAfterDate(
                transaction.userId,
                transaction.sourceWalletId,
                new Date(transaction.transactionDate),
                t
            );

            const mostSoonModifyBalanceTransactionOfDestinationWallet = await this.getMostSoonModifyBalanceTransactionAfterDate(
                transaction.userId,
                transferTransaction.destinationWalletId,
                new Date(transaction.transactionDate),
                t
            );

            if (!mostSoonModifyBalanceTransactionOfSourceWallet && !mostSoonModifyBalanceTransactionOfDestinationWallet) {
                // If both wallets do not have a most soon modify balance transaction, we can safely update the balances
                await this.walletService.increaseBalance(transaction.sourceWalletId, transaction.amount, t);
                await this.walletService.decreaseBalance(transferTransaction.destinationWalletId, transaction.amount, t);
            } else if (mostSoonModifyBalanceTransactionOfSourceWallet && !mostSoonModifyBalanceTransactionOfDestinationWallet) {
                await this.userService.decreaseTotalBalance(userId, transaction.amount, t);

                await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransactionOfSourceWallet, t);
                await this.walletService.decreaseBalance(transferTransaction.destinationWalletId, transaction.amount, t);
            } else if (!mostSoonModifyBalanceTransactionOfSourceWallet && mostSoonModifyBalanceTransactionOfDestinationWallet) {
                await this.userService.increaseTotalBalance(userId, transaction.amount, t);

                await this.walletService.increaseBalance(transaction.sourceWalletId, transaction.amount, t);
                await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransactionOfDestinationWallet, t);
            } else if (mostSoonModifyBalanceTransactionOfSourceWallet && mostSoonModifyBalanceTransactionOfDestinationWallet) {
                await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransactionOfSourceWallet, t);
                await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransactionOfDestinationWallet, t);
            }

            await transferTransaction.destroy({ transaction: t });
        }

        // case 6: modify balance
        if (transaction.type === TransactionType.MODIFY_BALANCE) {
            const modifyBalanceTransaction = await ModifyBalanceTransaction.findOne({
                where: {
                    generalTransactionId: transaction.id
                }
            });

            if (mostSoonModifyBalanceTransaction) {
                await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransaction, t);
            } else {
                const differ = transaction.amount;

                if (differ > 0) {
                    await this.walletService.decreaseBalance(transaction.sourceWalletId, differ, t);
                    await this.userService.decreaseTotalBalance(userId, differ, t);
                } else {
                    await this.walletService.increaseBalance(transaction.sourceWalletId, -differ, t);
                    await this.userService.increaseTotalBalance(userId, -differ, t);
                }
            }

            // Delete the modify balance transaction record
            await modifyBalanceTransaction.destroy({ transaction: t });
        }

        // Delete the transaction record
        await transaction.destroy({ transaction: t });
    }
}