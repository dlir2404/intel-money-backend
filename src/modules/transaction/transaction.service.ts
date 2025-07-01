import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";
import { BorrowTransaction, CollectingDebtTransaction, GeneralTransaction, LendTransaction, ModifyBalanceTransaction, RepaymentTransaction, TransferTransaction, Wallet } from "src/database/models";
import { TransactionType } from "src/shared/enums/transaction";
import { CreateGeneralTrans } from "src/shared/types/transactions/general";
import {
    CreateBorrowTransactionRequest,
    CreateCollectingDebtTransactionRequest,
    CreateGeneralTransactionRequest, CreateLendTransactionRequest,
    CreateModifyBalanceTransactionRequest,
    CreateRepaymentTransactionRequest,
    CreateTransferTransactionRequest,
    GetAllTransactionsRequest, UpdateBorrowTransactionRequest, UpdateCollectingDebtTransactionRequest, UpdateExpenseTransactionRequest,
    UpdateIncomeTransactionRequest, UpdateLendTransactionRequest,
    UpdateModifyBalanceTransactionRequest,
    UpdateRepaymentTransactionRequest,
    UpdateTransferTransactionRequest
} from "./transaction.dto";
import { UserService } from "../user/user.service";
import { WalletService } from "../wallet/wallet.service";
import { CategoryService } from "../category/category.service";
import { CategoryType } from "src/shared/enums/category";
import { RelatedUserService } from "../related-user/related-user.service";
import { Op, Transaction, WhereOptions } from "sequelize";
import { StatisticService } from "../statistic/statistic.service";
import { Time } from "src/shared/ultils/time";

@Injectable()
export class TransactionService {
    constructor(
        @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
        @Inject(forwardRef(() => CategoryService)) private readonly categoryService: CategoryService,
        @Inject(forwardRef(() => WalletService)) private readonly walletService: WalletService,
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
                },
                {
                    model: CollectingDebtTransaction,
                    required: false,
                    attributes: ['borrowerId']
                },
                {
                    model: RepaymentTransaction,
                    required: false,
                    attributes: ['lenderId']
                }
            ],
            order: [
                ['transactionDate', 'DESC'],
                ['id', 'DESC']
            ],
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
                case 'COLLECTING_DEBT':
                    if (data.collectingDebtTransaction) {
                        extraInfo = {
                            borrowerId: data.collectingDebtTransaction.borrowerId,
                        };
                    }
                    break;
                case 'REPAYMENT':
                    if (data.repaymentTransaction) {
                        extraInfo = {
                            lenderId: data.repaymentTransaction.lenderId,
                        };
                    }
                    break;
            }

            // Remove nested objects và add extraInfo
            delete data.lendTransaction;
            delete data.borrowTransaction;
            delete data.transferTransaction;
            delete data.modifyBalanceTransaction;
            delete data.collectingDebtTransaction;
            delete data.repaymentTransaction;

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

                await this.updateDataAfterCreateTransaction(transaction, t);

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

                await this.updateDataAfterCreateTransaction(transaction, t);

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


                const transferTransaction = await TransferTransaction.create({
                    generalTransactionId: transaction.id,
                    destinationWalletId: body.destinationWalletId
                }, { transaction: t });

                //attach transferTransaction to transaction
                transaction.transferTransaction = transferTransaction;

                await this.updateDataAfterCreateTransaction(transaction, t);

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

                //add extra info to table
                const lendTransaction = await LendTransaction.create({
                    generalTransactionId: transaction.id,
                    borrowerId: body.borrowerId,
                    collectionDate: body.collectionDate,
                    collectedAmount: 0
                }, { transaction: t });

                //attach lendTransaction to transaction
                transaction.lendTransaction = lendTransaction;

                await this.updateDataAfterCreateTransaction(transaction, t);

                return transaction;
            });

            return {
                ...result.dataValues,
                extraInfo: {
                    borrowerId: body.borrowerId,
                    collectionDate: body.collectionDate,
                }
            };
        } catch (error) {
            throw new BadRequestException(`Failed to create lend transaction: ${error.message}`);
        }
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

                //add extra info to table
                const borrowTransaction = await BorrowTransaction.create({
                    generalTransactionId: transaction.id,
                    lenderId: body.lenderId,
                    repaymentDate: body.repaymentDate,
                    repaymentAmount: 0
                }, { transaction: t });

                //attach borrowTransaction to transaction
                transaction.borrowTransaction = borrowTransaction;

                await this.updateDataAfterCreateTransaction(transaction, t);

                return transaction;
            });

            return {
                ...result.dataValues,
                extraInfo: {
                    lenderId: body.lenderId,
                    repaymentDate: body.repaymentDate,
                },
            };
        } catch (error) {
            throw new BadRequestException(`Failed to create borrow transaction: ${error.message}`);
        }
    }

    async createModifyBalance(body: CreateModifyBalanceTransactionRequest, userId: number) {
        const wallet = await this.walletService.findById(body.sourceWalletId, userId);

        //cho nay can la balance cua wallet tai thoi diem cua giao dich nay
        //=> can phai tinh toan tu lan dieu chinh so du gan nhat
        const oldBalance = await this.calculateBalanceAtDate(userId, wallet, new Date(body.transactionDate));

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

                // Create modify balance transaction record
                const modifyBalanceTransaction = await ModifyBalanceTransaction.create({
                    generalTransactionId: transaction.id,
                    newRealBalance: body.newRealBalance
                }, { transaction: t });

                //attach modifyBalanceTransaction to transaction
                transaction.modifyBalanceTransaction = modifyBalanceTransaction;

                await this.updateDataAfterCreateTransaction(transaction, t);

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


    async createCollectingDebt(body: CreateCollectingDebtTransactionRequest, userId: number) {
        if (body.amount <= 0) {
            throw new BadRequestException('Transaction amount must be positive');
        }

        const sourceWallet = await this.walletService.findById(body.sourceWalletId, userId);
        const borrower = await this.relatedUserService.findById(body.borrowerId, userId);

        try {
            const result = await this.sequelize.transaction(async (t) => {
                // Create the transaction record
                const transaction = await this.createGeneralTransaction({
                    type: TransactionType.COLLECTING_DEBT,
                    ...body,
                    userId
                }, t);

                //add extra info to table
                const collectingDebtTransaction = await CollectingDebtTransaction.create({
                    generalTransactionId: transaction.id,
                    borrowerId: body.borrowerId,
                }, { transaction: t });

                //attach collectingDebtTransaction to transaction
                transaction.collectingDebtTransaction = collectingDebtTransaction;

                await this.updateDataAfterCreateTransaction(transaction, t);

                return transaction;
            });

            return {
                ...result.dataValues,
                extraInfo: {
                    borrowerId: body.borrowerId,
                },
            };
        } catch (error) {
            throw new BadRequestException(`Failed to create borrow transaction: ${error.message}`);
        }
    }

    async createRepayment(body: CreateRepaymentTransactionRequest, userId: number) {
        if (body.amount <= 0) {
            throw new BadRequestException('Transaction amount must be positive');
        }

        const sourceWallet = await this.walletService.findById(body.sourceWalletId, userId);
        const lender = await this.relatedUserService.findById(body.lenderId, userId);

        try {
            const result = await this.sequelize.transaction(async (t) => {
                // Create the transaction record
                const transaction = await this.createGeneralTransaction({
                    type: TransactionType.REPAYMENT,
                    ...body,
                    userId
                }, t);

                //add extra info to table
                const repaymentTransaction = await RepaymentTransaction.create({
                    generalTransactionId: transaction.id,
                    lenderId: body.lenderId,
                }, { transaction: t });

                //attach repaymentTransaction to transaction
                transaction.repaymentTransaction = repaymentTransaction;

                await this.updateDataAfterCreateTransaction(transaction, t);

                return transaction;
            });

            return {
                ...result.dataValues,
                extraInfo: {
                    lenderId: body.lenderId,
                }
            };
        } catch (error) {
            throw new BadRequestException(`Failed to create lend transaction: ${error.message}`);
        }
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
        } else if (transaction.type === TransactionType.COLLECTING_DEBT) {
            newDiff = oldDiff - transaction.amount;
        } else if (transaction.type === TransactionType.REPAYMENT) {
            newDiff = oldDiff + transaction.amount;
        }


        if (oldDiff < 0 && newDiff > 0) {
            //It means that change from expense to income
            const otherIncomeCategory = await this.categoryService.findOtherIncomeCategory(transaction.userId);

            await mostSoonModifyBalanceTransaction.update({
                categoryId: otherIncomeCategory.id,
                amount: newDiff
            }, { transaction: t });
        } else if (oldDiff > 0 && newDiff < 0) {
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
        } else if (transaction.type === TransactionType.COLLECTING_DEBT) {
            newDiff = oldDiff + transaction.amount;
        } else if (transaction.type === TransactionType.REPAYMENT) {
            newDiff = oldDiff - transaction.amount;
        }

        if (oldDiff < 0 && newDiff > 0) {
            //It means that change from expense to income
            const otherIncomeCategory = await this.categoryService.findOtherIncomeCategory(transaction.userId);

            await mostSoonModifyBalanceTransaction.update({
                categoryId: otherIncomeCategory.id,
                amount: newDiff
            }, { transaction: t });
        } else if (oldDiff > 0 && newDiff < 0) {
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
        t?: Transaction,
        excludeTransactionId?: number
    ) {
        const where: WhereOptions<GeneralTransaction> = {
            userId: userId,
            sourceWalletId: sourceWalletId,
            type: TransactionType.MODIFY_BALANCE,
            transactionDate: {
                [Op.lte]: date // less than to the given date
            }
        };

        if (excludeTransactionId) {
            where['id'] = {
                [Op.ne]: excludeTransactionId // exclude the transaction being updated or deleted
            };
        }

        const transaction = await GeneralTransaction.findOne(
            {
                where,
                include: [{
                    model: ModifyBalanceTransaction,
                    required: true,
                    attributes: ['newRealBalance']
                }],
                order: [
                    ['transactionDate', 'DESC'],
                    ['id', 'DESC']
                ], // descending to get the latest one
                transaction: t
            }
        )

        return transaction ? transaction : null;
    }

    async getMostSoonModifyBalanceTransactionAfterTransaction(
        transaction: GeneralTransaction,
        sourceWalletId: number,
        t?: Transaction,
    ) {
        const where: WhereOptions<GeneralTransaction> = {
            userId: transaction.userId,
            sourceWalletId: sourceWalletId,
            type: TransactionType.MODIFY_BALANCE,
            transactionDate: {
                [Op.gte]: transaction.transactionDate // greater than the given date
            }
        };

        const result = await GeneralTransaction.findAll(
            {
                where,
                order: [
                    ['transactionDate', 'ASC'],
                    ['id', 'ASC']
                ], // ascending to get the nearest after
                transaction: t
            }
        )

        for (const trans of result) {
            if (Time.isSame(transaction.transactionDate, trans.transactionDate)) {
                if (trans.id > transaction.id) {
                    // If there are multiple transactions at the same time, we take the one with the greater id
                    return trans;
                }
            } else {
                return trans
            }
        }

        return null;
    }

    async getFirstModifyBalanceTransactions(
        userId: number,
        sourceWalletId: number,
        t?: Transaction
    ): Promise<GeneralTransaction | null> {
        const where: WhereOptions<GeneralTransaction> = {
            userId: userId,
            sourceWalletId: sourceWalletId,
            type: TransactionType.MODIFY_BALANCE
        };

        const transactions = await GeneralTransaction.findOne({
            where,
            include: [{
                model: ModifyBalanceTransaction,
                required: true,
                attributes: ['newRealBalance']
            }],
            order: [
                ['transactionDate', 'ASC'],
                ['id', 'ASC']
            ],
            transaction: t
        });

        return transactions;
    }

    //exclude transaction is used to exclude the transaction that is being updated or deleted, and the new transaction date is modified to be after the origin
    async calculateBalanceAtDate(
        userId: number,
        sourceWallet: Wallet,
        date: Date,
        exludeTransactionId?: number
    ) {
        let balance = sourceWallet.baseBalance;

        const latestModifyBalanceTransaction = await this.getLatestModifyBalanceTransactionAtDate(
            userId,
            sourceWallet.id,
            date,
            undefined,
            exludeTransactionId
        );

        if (latestModifyBalanceTransaction != null) {
            balance = latestModifyBalanceTransaction.modifyBalanceTransaction.newRealBalance;
        }


        //GET ALL RELATED TRANSACTIONS
        const where: WhereOptions<GeneralTransaction> = {
            userId: userId,
            [Op.or]: [
                // Transactions with this wallet as source
                { sourceWalletId: sourceWallet.id },
                // Transfer transactions with this wallet as destination
                {
                    type: TransactionType.TRANSFER,
                    '$transferTransaction.destinationWalletId$': sourceWallet.id
                }
            ],
            transactionDate: {
                [Op.lte]: date
            },
        };

        if (latestModifyBalanceTransaction) {
            where['transactionDate'] = {
                [Op.lte]: date,
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
            order: [
                ['transactionDate', 'ASC'],
                ['id', 'ASC']
            ],
            raw: true
        });

        for (const transaction of recentTransactionsFromLatestModifyBalance) {
            if (latestModifyBalanceTransaction && transaction.id === latestModifyBalanceTransaction.id) {
                continue; // Skip the latest modify balance transaction
            }

            if (exludeTransactionId && transaction.id === exludeTransactionId) {
                continue; // Skip the excluded transaction
            }

            if (latestModifyBalanceTransaction && Time.isSame(transaction.transactionDate, latestModifyBalanceTransaction.transactionDate)) {
                //there can be multiple transactions at the same time, we compare them by id
                if (transaction.id < latestModifyBalanceTransaction.id) {
                    continue; // Skip this transaction if it is before the latest modify balance transaction
                }
            }

            if (transaction.type === TransactionType.INCOME) {
                balance += transaction.amount;
            } else if (transaction.type === TransactionType.EXPENSE) {
                balance -= transaction.amount;
            } else if (transaction.type === TransactionType.TRANSFER) {
                if (transaction.sourceWalletId === sourceWallet.id) {
                    balance -= transaction.amount; // transfer out
                } else {
                    balance += transaction.amount; // transfer in
                }
            } else if (transaction.type === TransactionType.LEND) {
                balance -= transaction.amount; // lend out
            } else if (transaction.type === TransactionType.BORROW) {
                balance += transaction.amount; // borrow in
            } else if (transaction.type === TransactionType.COLLECTING_DEBT) {
                balance += transaction.amount; // collecting debt
            } else if (transaction.type === TransactionType.REPAYMENT) {
                balance -= transaction.amount; // repayment
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
                const transaction = await GeneralTransaction.findByPk(id);

                //act like remove then create new
                await this.updateDataBeforeRemoveTransaction(transaction, t);

                //TODO: also need to validate here
                await transaction.update({
                    ...body,
                    userId: userId,
                }, { transaction: t });

                await this.updateDataAfterCreateTransaction(transaction, t);

                return transaction.dataValues;
            });
        } catch (error) {
            throw new InternalServerErrorException("Failed to update transaction: " + error.message);
        }
    }

    async updateExpense(id: number, body: UpdateExpenseTransactionRequest, userId: number) {
        try {
            return await this.sequelize.transaction(async (t) => {
                const transaction = await GeneralTransaction.findByPk(id);

                //act like remove then create new
                await this.updateDataBeforeRemoveTransaction(transaction, t);

                await transaction.update({
                    ...body,
                    userId: userId,
                }, { transaction: t });

                await this.updateDataAfterCreateTransaction(transaction, t);

                return transaction.dataValues;
            });
        } catch (error) {
            throw new InternalServerErrorException("Failed to update transaction: " + error.message);
        }
    }

    async updateTransfer(id: number, body: UpdateTransferTransactionRequest, userId: number) {
        try {
            return await this.sequelize.transaction(async (t) => {
                const transaction = await GeneralTransaction.findOne({
                    where: {
                        id: id,
                        userId: userId
                    },
                    include: [{
                        model: TransferTransaction,
                        required: true,
                        attributes: ['id', 'destinationWalletId']
                    }]
                });

                //act like remove then create new
                await this.updateDataBeforeRemoveTransaction(transaction, t);

                await transaction.update({
                    ...body,
                    userId: userId,
                }, { transaction: t });

                if (body.destinationWalletId != transaction.transferTransaction.destinationWalletId) {
                    // If destinationWalletId is changed, we need to update the transferTransaction
                    await transaction.transferTransaction.update({
                        destinationWalletId: body.destinationWalletId,
                    }, { transaction: t });
                }

                await this.updateDataAfterCreateTransaction(transaction, t);

                return {
                    ...transaction.dataValues,
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
                const transaction = await GeneralTransaction.findOne({
                    where: {
                        id: id,
                        userId: userId
                    },
                    include: [{
                        model: LendTransaction,
                        required: true,
                        attributes: ['id', 'borrowerId', 'collectionDate', 'collectedAmount']
                    }]
                });

                //act like remove then create new
                await this.updateDataBeforeRemoveTransaction(transaction, t);

                await transaction.update({
                    ...body,
                    userId: userId,
                }, { transaction: t });

                if (body.borrowerId != transaction.lendTransaction.borrowerId) {
                    // If borrowerId is changed, we need to update the lendTransaction
                    await transaction.lendTransaction.update({
                        borrowerId: body.borrowerId,
                    }, { transaction: t });
                }

                await this.updateDataAfterCreateTransaction(transaction, t);


                return {
                    ...transaction.dataValues,
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
                const transaction = await GeneralTransaction.findOne({
                    where: {
                        id: id,
                        userId: userId
                    },
                    include: [{
                        model: BorrowTransaction,
                        required: true,
                        attributes: ['id', 'lenderId', 'repaymentDate', 'repaymentAmount']
                    }]
                });

                //act like remove then create new
                await this.updateDataBeforeRemoveTransaction(transaction, t);

                await transaction.update({
                    ...body,
                    userId: userId,
                }, { transaction: t });

                if (body.lenderId != transaction.borrowTransaction.lenderId) {
                    // If lenderId is changed, we need to update the borrowTransaction
                    await transaction.borrowTransaction.update({
                        lenderId: body.lenderId,
                    }, { transaction: t });
                }

                await this.updateDataAfterCreateTransaction(transaction, t);

                return {
                    ...transaction.dataValues,
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
                const transaction = await GeneralTransaction.findOne({
                    where: {
                        id: id,
                        userId: userId
                    },
                    include: [{
                        model: ModifyBalanceTransaction,
                        required: true,
                        attributes: ['id', 'newRealBalance']
                    }]
                });

                //act like remove then create new
                await this.updateDataBeforeRemoveTransaction(transaction, t);

                await transaction.update({
                    ...body,
                    userId: userId,
                }, { transaction: t });

                if (body.newRealBalance != transaction.modifyBalanceTransaction.newRealBalance) {
                    // If newRealBalance is changed, we need to update the modifyBalanceTransaction
                    await transaction.modifyBalanceTransaction.update({
                        newRealBalance: body.newRealBalance,
                    }, { transaction: t });
                }

                await this.updateDataAfterCreateTransaction(transaction, t);

                return {
                    ...transaction.dataValues,
                    extraInfo: {
                        newRealBalance: body.newRealBalance,
                    }
                };
            });
        } catch (error) {
            throw new InternalServerErrorException("Failed to update transaction: " + error.message);
        }
    }

    async updateCollectingDebt(id: number, body: UpdateCollectingDebtTransactionRequest, userId: number) {
        try {
            return await this.sequelize.transaction(async (t) => {
                const transaction = await GeneralTransaction.findOne({
                    where: {
                        id: id,
                        userId: userId
                    },
                    include: [{
                        model: CollectingDebtTransaction,
                        required: true,
                        attributes: ['id', 'borrowerId']
                    }]
                });

                //act like remove then create new
                await this.updateDataBeforeRemoveTransaction(transaction, t);

                await transaction.update({
                    ...body,
                    userId: userId,
                }, { transaction: t });

                if (body.borrowerId != transaction.collectingDebtTransaction.borrowerId) {
                    // If lenderId is changed, we need to update the collectingDebtTransaction
                    await transaction.collectingDebtTransaction.update({
                        borrowerId: body.borrowerId,
                    }, { transaction: t });
                }

                await this.updateDataAfterCreateTransaction(transaction, t);

                return {
                    ...transaction.dataValues,
                    extraInfo: {
                        borrowerId: body.borrowerId,
                    }
                };
            });
        } catch (error) {
            throw new InternalServerErrorException("Failed to update transaction: " + error.message);
        }
    }

    async updateRepayment(id: number, body: UpdateRepaymentTransactionRequest, userId: number) {
        try {
            return await this.sequelize.transaction(async (t) => {
                const transaction = await GeneralTransaction.findOne({
                    where: {
                        id: id,
                        userId: userId
                    },
                    include: [{
                        model: RepaymentTransaction,
                        required: true,
                        attributes: ['id', 'lenderId']
                    }]
                });

                //act like remove then create new
                await this.updateDataBeforeRemoveTransaction(transaction, t);

                await transaction.update({
                    ...body,
                    userId: userId,
                }, { transaction: t });

                if (body.lenderId != transaction.repaymentTransaction.lenderId) {
                    // If lenderId is changed, we need to update the repaymentTransaction
                    await transaction.repaymentTransaction.update({
                        lenderId: body.lenderId,
                    }, { transaction: t });
                }

                await this.updateDataAfterCreateTransaction(transaction, t);

                return {
                    ...transaction.dataValues,
                    extraInfo: {
                        lenderId: body.lenderId,
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
                await this.updateDataBeforeRemoveTransaction(transaction, t);

                // await this.statisticService.updateCacheAfterRemoveTransaction(transaction.userId, transaction);


                //case 3: lend
                if (transaction.type === TransactionType.LEND) {
                    await LendTransaction.destroy({
                        where: {
                            generalTransactionId: transaction.id
                        }
                    });
                }

                //case 4: borrow
                if (transaction.type === TransactionType.BORROW) {
                    await BorrowTransaction.destroy({
                        where: {
                            generalTransactionId: transaction.id
                        }
                    });
                }

                //case 5: transfer
                if (transaction.type === TransactionType.TRANSFER) {
                    await TransferTransaction.destroy({
                        where: {
                            generalTransactionId: transaction.id
                        }
                    });
                }

                // case 6: modify balance
                if (transaction.type === TransactionType.MODIFY_BALANCE) {
                    await ModifyBalanceTransaction.destroy({
                        where: {
                            generalTransactionId: transaction.id
                        }
                    });
                }

                // case 7: collecting debt
                if (transaction.type === TransactionType.COLLECTING_DEBT) {
                    await CollectingDebtTransaction.destroy({
                        where: {
                            generalTransactionId: transaction.id
                        }
                    });
                }

                // case 8: repayment
                if (transaction.type === TransactionType.REPAYMENT) {
                    await RepaymentTransaction.destroy({
                        where: {
                            generalTransactionId: transaction.id
                        }
                    });
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

    async removeTransactionInSequelizeTransaction(transaction: GeneralTransaction, t: Transaction) {
        await this.updateDataBeforeRemoveTransaction(transaction, t);

        //case 3: lend
        if (transaction.type === TransactionType.LEND) {
            await LendTransaction.destroy({
                where: {
                    generalTransactionId: transaction.id
                }
            });
        }

        //case 4: borrow
        if (transaction.type === TransactionType.BORROW) {
            await BorrowTransaction.destroy({
                where: {
                    generalTransactionId: transaction.id
                }
            });
        }

        //case 5: transfer
        if (transaction.type === TransactionType.TRANSFER) {
            await TransferTransaction.destroy({
                where: {
                    generalTransactionId: transaction.id
                }
            });
        }

        // case 6: modify balance
        if (transaction.type === TransactionType.MODIFY_BALANCE) {
            await ModifyBalanceTransaction.destroy({
                where: {
                    generalTransactionId: transaction.id
                }
            });
        }

        // case 7: collecting debt
        if (transaction.type === TransactionType.COLLECTING_DEBT) {
            await CollectingDebtTransaction.destroy({
                where: {
                    generalTransactionId: transaction.id
                }
            });
        }

        // case 8: repayment
        if (transaction.type === TransactionType.REPAYMENT) {
            await RepaymentTransaction.destroy({
                where: {
                    generalTransactionId: transaction.id
                }
            });
        }


        // Delete the transaction record
        await transaction.destroy({ transaction: t });
    }

    async updateDataAfterCreateTransaction(transaction: GeneralTransaction, t: Transaction) {
        const mostSoonModifyBalanceTransaction = await this.getMostSoonModifyBalanceTransactionAfterTransaction(
            transaction,
            transaction.sourceWalletId,
            t
        );

        switch (transaction.type) {
            case TransactionType.INCOME:
                if (mostSoonModifyBalanceTransaction) {
                    // Update the most soon modify balance transaction
                    await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransaction, t);
                } else {
                    // Update user's total balance
                    await this.userService.increaseTotalBalance(transaction.userId, transaction.amount, t);

                    // Update wallet balance
                    await this.walletService.increaseBalance(transaction.sourceWalletId, transaction.amount, t);
                }
                break;
            case TransactionType.EXPENSE:
                if (mostSoonModifyBalanceTransaction) {
                    // Update the most soon modify balance transaction
                    await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransaction, t);
                } else {
                    // Update user's total balance
                    await this.userService.decreaseTotalBalance(transaction.userId, transaction.amount, t);

                    // Update wallet balance
                    await this.walletService.decreaseBalance(transaction.sourceWalletId, transaction.amount, t);
                }
                break;
            case TransactionType.LEND:
                if (mostSoonModifyBalanceTransaction) {
                    // Update the most soon modify balance transaction
                    await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransaction, t);
                } else {
                    // Update wallet balance
                    await this.walletService.decreaseBalance(transaction.sourceWalletId, transaction.amount, t);
                }

                // Update user's total loan
                await this.userService.increaseTotalLoan(transaction.userId, transaction.amount, t);

                // Update borrower's total debt
                await this.relatedUserService.increaseTotalDebt(transaction.lendTransaction.borrowerId, transaction.amount, t);
                break;
            case TransactionType.COLLECTING_DEBT:
                if (mostSoonModifyBalanceTransaction) {
                    // Update the most soon modify balance transaction
                    await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransaction, t);
                } else {
                    // Update wallet balance
                    await this.walletService.increaseBalance(transaction.sourceWalletId, transaction.amount, t);
                }

                // Update user's total loan
                await this.userService.decreaseTotalLoan(transaction.userId, transaction.amount, t);
                // Update borrower's total loan
                await this.relatedUserService.increaseTotalCollected(transaction.collectingDebtTransaction.borrowerId, transaction.amount, t);
                break;
            case TransactionType.BORROW:
                if (mostSoonModifyBalanceTransaction) {
                    // Update the most soon modify balance transaction
                    await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransaction, t);
                } else {
                    // Update source wallet balance
                    await this.walletService.increaseBalance(transaction.sourceWalletId, transaction.amount, t);
                }

                // Update user's total debt
                await this.userService.increaseTotalDebt(transaction.userId, transaction.amount, t);

                // Update lender's total loan
                await this.relatedUserService.increaseTotalLoan(transaction.borrowTransaction.lenderId, transaction.amount, t);
                break;
            case TransactionType.REPAYMENT:
                if (mostSoonModifyBalanceTransaction) {
                    // Update the most soon modify balance transaction
                    await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransaction, t);
                } else {
                    // Update source wallet balance
                    await this.walletService.decreaseBalance(transaction.sourceWalletId, transaction.amount, t);
                }

                // Update user's total debt
                await this.userService.decreaseTotalDebt(transaction.userId, transaction.amount, t);
                // Update lender's total loan
                await this.relatedUserService.increaseTotalPaid(transaction.repaymentTransaction.lenderId, transaction.amount, t);
                break;
            case TransactionType.TRANSFER:
                const mostSoonModifyBalanceTransactionOfSourceWallet = mostSoonModifyBalanceTransaction;

                const mostSoonModifyBalanceTransactionOfDestinationWallet = await this.getMostSoonModifyBalanceTransactionAfterTransaction(
                    transaction,
                    transaction.transferTransaction.destinationWalletId,
                    t
                );

                if (!mostSoonModifyBalanceTransactionOfSourceWallet && !mostSoonModifyBalanceTransactionOfDestinationWallet) {
                    // If both wallets do not have a most soon modify balance transaction, we can safely update the balances
                    await this.walletService.decreaseBalance(transaction.sourceWalletId, transaction.amount, t);
                    await this.walletService.increaseBalance(transaction.transferTransaction.destinationWalletId, transaction.amount, t);
                } else if (mostSoonModifyBalanceTransactionOfSourceWallet && !mostSoonModifyBalanceTransactionOfDestinationWallet) {
                    await this.userService.increaseTotalBalance(transaction.userId, transaction.amount, t);

                    await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransactionOfSourceWallet, t);
                    await this.walletService.increaseBalance(transaction.transferTransaction.destinationWalletId, transaction.amount, t);
                } else if (!mostSoonModifyBalanceTransactionOfSourceWallet && mostSoonModifyBalanceTransactionOfDestinationWallet) {
                    await this.userService.decreaseTotalBalance(transaction.userId, transaction.amount, t);

                    await this.walletService.decreaseBalance(transaction.sourceWalletId, transaction.amount, t);
                    await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransactionOfDestinationWallet, t);
                } else if (mostSoonModifyBalanceTransactionOfSourceWallet && mostSoonModifyBalanceTransactionOfDestinationWallet) {
                    await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransactionOfSourceWallet, t);
                    await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransactionOfDestinationWallet, t);
                }
                break;
            case TransactionType.MODIFY_BALANCE:
                if (mostSoonModifyBalanceTransaction) {
                    // Update the most soon modify balance transaction
                    await this.updateMostSoonModifyBalanceTransactionAfterCreateTransaction(transaction, mostSoonModifyBalanceTransaction, t);
                } else {
                    if (transaction.amount > 0) {
                        await this.walletService.increaseBalance(transaction.sourceWalletId, transaction.amount, t);
                        await this.userService.increaseTotalBalance(transaction.userId, transaction.amount, t);
                    } else {
                        await this.walletService.decreaseBalance(transaction.sourceWalletId, -transaction.amount, t);
                        await this.userService.decreaseTotalBalance(transaction.userId, -transaction.amount, t);
                    }
                }

        }

        await this.statisticService.updateCacheAfterCreateTransaction(transaction.userId, transaction, mostSoonModifyBalanceTransaction);
    }

    async updateDataBeforeRemoveTransaction(
        transaction: GeneralTransaction,
        t: Transaction,
    ) {
        const mostSoonModifyBalanceTransaction = await this.getMostSoonModifyBalanceTransactionAfterTransaction(
            transaction,
            transaction.sourceWalletId,
            t
        );

        switch (transaction.type) {
            case TransactionType.INCOME:
                if (mostSoonModifyBalanceTransaction) {
                    await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransaction, t);
                } else {
                    await this.userService.decreaseTotalBalance(transaction.userId, transaction.amount, t);
                    await this.walletService.decreaseBalance(transaction.sourceWalletId, transaction.amount, t);
                }
                break;
            case TransactionType.EXPENSE:
                if (transaction.type === TransactionType.EXPENSE) {
                    if (mostSoonModifyBalanceTransaction) {
                        await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransaction, t);
                    } else {
                        await this.userService.increaseTotalBalance(transaction.userId, transaction.amount, t);
                        await this.walletService.increaseBalance(transaction.sourceWalletId, transaction.amount, t);
                    }
                }
                break;
            case TransactionType.LEND:
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

                break;
            case TransactionType.COLLECTING_DEBT:
                const collectingDebtTransaction = await CollectingDebtTransaction.findOne({
                    where: {
                        generalTransactionId: transaction.id
                    }
                });

                if (mostSoonModifyBalanceTransaction) {
                    await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransaction, t);
                } else {
                    await this.walletService.decreaseBalance(transaction.sourceWalletId, transaction.amount, t);
                }

                await this.userService.increaseTotalLoan(transaction.userId, transaction.amount, t);
                await this.relatedUserService.decreaseTotalCollected(collectingDebtTransaction.borrowerId, transaction.amount, t);

                break;
            case TransactionType.BORROW:
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

                break;
            case TransactionType.REPAYMENT:
                const repaymentTransaction = await RepaymentTransaction.findOne({
                    where: {
                        generalTransactionId: transaction.id
                    }
                });

                if (mostSoonModifyBalanceTransaction) {
                    await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransaction, t);
                } else {
                    await this.walletService.increaseBalance(transaction.sourceWalletId, transaction.amount, t);
                }

                await this.userService.increaseTotalDebt(transaction.userId, transaction.amount, t);
                await this.relatedUserService.decreaseTotalPaid(repaymentTransaction.lenderId, transaction.amount, t);

                break;
            case TransactionType.TRANSFER:
                const transferTransaction = await TransferTransaction.findOne({
                    where: {
                        generalTransactionId: transaction.id
                    }
                });

                const mostSoonModifyBalanceTransactionOfSourceWallet = mostSoonModifyBalanceTransaction;

                const mostSoonModifyBalanceTransactionOfDestinationWallet = await this.getMostSoonModifyBalanceTransactionAfterTransaction(
                    transaction,
                    transferTransaction.destinationWalletId,
                    t
                );

                if (!mostSoonModifyBalanceTransactionOfSourceWallet && !mostSoonModifyBalanceTransactionOfDestinationWallet) {
                    // If both wallets do not have a most soon modify balance transaction, we can safely update the balances
                    await this.walletService.increaseBalance(transaction.sourceWalletId, transaction.amount, t);
                    await this.walletService.decreaseBalance(transferTransaction.destinationWalletId, transaction.amount, t);
                } else if (mostSoonModifyBalanceTransactionOfSourceWallet && !mostSoonModifyBalanceTransactionOfDestinationWallet) {
                    await this.userService.decreaseTotalBalance(transaction.userId, transaction.amount, t);

                    await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransactionOfSourceWallet, t);
                    await this.walletService.decreaseBalance(transferTransaction.destinationWalletId, transaction.amount, t);
                } else if (!mostSoonModifyBalanceTransactionOfSourceWallet && mostSoonModifyBalanceTransactionOfDestinationWallet) {
                    await this.userService.increaseTotalBalance(transaction.userId, transaction.amount, t);

                    await this.walletService.increaseBalance(transaction.sourceWalletId, transaction.amount, t);
                    await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransactionOfDestinationWallet, t);
                } else if (mostSoonModifyBalanceTransactionOfSourceWallet && mostSoonModifyBalanceTransactionOfDestinationWallet) {
                    await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransactionOfSourceWallet, t);
                    await this.updateMostSoonModifyBalanceTransactionBeforeRemoveTransaction(transaction, mostSoonModifyBalanceTransactionOfDestinationWallet, t);
                }
                break;
            case TransactionType.MODIFY_BALANCE:
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
                        await this.userService.decreaseTotalBalance(transaction.userId, differ, t);
                    } else {
                        await this.walletService.increaseBalance(transaction.sourceWalletId, -differ, t);
                        await this.userService.increaseTotalBalance(transaction.userId, -differ, t);
                    }
                }
        }

        await this.statisticService.updateCacheAfterRemoveTransaction(transaction.userId, transaction, mostSoonModifyBalanceTransaction);
    }


    async removeTransactionByWalletId(
        userId: number,
        walletId: number,
        callback?: (t: Transaction) => Promise<void>
    ) {
        const where: WhereOptions<GeneralTransaction> = {
            userId: userId,
            [Op.or]: [
                // Transactions with this wallet as source
                { sourceWalletId: walletId },
                // Transfer transactions with this wallet as destination
                {
                    type: TransactionType.TRANSFER,
                    '$transferTransaction.destinationWalletId$': walletId
                }
            ]
        };

        try {
            const result = await this.sequelize.transaction(async (t) => {
                const transactions = await GeneralTransaction.findAll({
                    where: where,
                    include: [
                        {
                            model: TransferTransaction,
                            required: false,
                            attributes: ['destinationWalletId']
                        },
                    ],
                    order: [['transactionDate', 'DESC'], ['id', 'DESC']],
                    transaction: t,
                });

                for (const transaction of transactions) {
                    await this.removeTransactionInSequelizeTransaction(transaction, t);
                }

                if (callback) {
                    await callback(t);
                }
            });

            return { result: true }
        } catch (error) {
            throw new InternalServerErrorException("Failed to remove transactions by wallet ID: " + error.message);
        }
    }

    async removeTransactionByCategoryId(
        userId: number,
        categoryId: number,
        callback?: (t: Transaction) => Promise<void>
    ) {
        const where: WhereOptions<GeneralTransaction> = {
            userId: userId,
            categoryId: categoryId
        };

        try {
            const result = await this.sequelize.transaction(async (t) => {
                const transactions = await GeneralTransaction.findAll({
                    where: where,
                    order: [['transactionDate', 'DESC'], ['id', 'DESC']],
                    transaction: t,
                });

                for (const transaction of transactions) {
                    await this.removeTransactionInSequelizeTransaction(transaction, t);
                }

                if (callback) {
                    await callback(t);
                }
            });

            return { result: true }
        } catch (error) {
            throw new InternalServerErrorException("Failed to remove transactions by category ID: " + error.message);
        }
    }

    async reset(userId: number, t: Transaction) {
        // First, get all general transaction IDs for this user
        const generalTransactions = await GeneralTransaction.findAll({
            where: {
                userId: userId
            },
            attributes: ['id'],
            transaction: t
        });

        const generalTransactionIds = generalTransactions.map(gt => gt.id);

        if (generalTransactionIds.length > 0) {
            // Reset all extra info transactions first using generalTransactionId
            await LendTransaction.destroy({
                where: {
                    generalTransactionId: {
                        [Op.in]: generalTransactionIds
                    }
                },
                transaction: t
            });

            await BorrowTransaction.destroy({
                where: {
                    generalTransactionId: {
                        [Op.in]: generalTransactionIds
                    }
                },
                transaction: t
            });

            await TransferTransaction.destroy({
                where: {
                    generalTransactionId: {
                        [Op.in]: generalTransactionIds
                    }
                },
                transaction: t
            });

            await ModifyBalanceTransaction.destroy({
                where: {
                    generalTransactionId: {
                        [Op.in]: generalTransactionIds
                    }
                },
                transaction: t
            });

            await CollectingDebtTransaction.destroy({
                where: {
                    generalTransactionId: {
                        [Op.in]: generalTransactionIds
                    }
                },
                transaction: t
            });

            await RepaymentTransaction.destroy({
                where: {
                    generalTransactionId: {
                        [Op.in]: generalTransactionIds
                    }
                },
                transaction: t
            });
        }

        // Then reset all general transactions
        await GeneralTransaction.destroy({
            where: {
                userId: userId
            },
            transaction: t
        });
    }
}