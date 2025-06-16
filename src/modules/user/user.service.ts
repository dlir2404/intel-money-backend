import {BadRequestException, forwardRef, Inject, Injectable, NotFoundException} from '@nestjs/common';
import {User} from 'src/database/models';
import {CreateUserRequest} from './user.dto';
import * as bcrypt from 'bcrypt';
import {SALT_OR_ROUNDS} from 'src/shared/constants';
import {Transaction} from 'sequelize';
import { TransactionService } from '../transaction/transaction.service';
import { Sequelize } from 'sequelize-typescript';
import { RelatedUserService } from '../related-user/related-user.service';
import { CategoryService } from '../category/category.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class UserService {
    constructor(
        @Inject(forwardRef(() => TransactionService)) private readonly transactionService: TransactionService,
        @Inject(forwardRef(() => CategoryService)) private readonly categoryService: CategoryService,
        @Inject(forwardRef(() => WalletService)) private readonly walletService: WalletService,
        private readonly relatedUserService: RelatedUserService,
        private readonly sequelize: Sequelize
    ) {}


    async createUser(body : CreateUserRequest, t?: Transaction) {
        const existUser = await User.findOne({ where: { email: body.email}});

        if (existUser) {
            //potential bug cuz confict between user role
            throw new BadRequestException('User exists')
        }

        const {password, ...rest} = body
        const hashPassword = await bcrypt.hash(password, SALT_OR_ROUNDS)

        const user = await User.create({
            ...rest,
            password: hashPassword,
        }, { transaction: t });

        return user;
    }

    async setNewPassword(user: User, newPassword: string) {
        user.password = await bcrypt.hash(newPassword, SALT_OR_ROUNDS);
        await user.save();
    }

    async increaseTotalBalance(userId: number, amount: number, t: Transaction) {
        await User.increment({ totalBalance: amount }, { where: { id: userId }, transaction: t });
    }

    async decreaseTotalBalance(userId: number, amount: number, t: Transaction) {
        await User.decrement({ totalBalance: amount }, { where: { id: userId }, transaction: t });
    }

    async increaseTotalLoan(userId: number, amount: number, t: Transaction) {
        await User.increment({ totalLoan: amount }, { where: { id: userId }, transaction: t });
    }

    async decreaseTotalLoan(userId: number, amount: number, t: Transaction) {
        await User.decrement({ totalLoan: amount }, { where: { id: userId }, transaction: t });
    }

    async increaseTotalDebt(userId: number, amount: number, t: Transaction) {
        await User.increment({ totalDebt: amount }, { where: { id: userId }, transaction: t });
    }

    async decreaseTotalDebt(userId: number, amount: number, t: Transaction) {
        await User.decrement({ totalDebt: amount }, { where: { id: userId }, transaction: t });
    }
    
    async changeAvatar(url: string, userId: number) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        user.picture = url;
        await user.save();
        return user;
    }

    async changeTimeZone(timezone: string, userId: number) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        user.preferences = {
            ...user.preferences,
            timezone: timezone
        };
        await user.save();
    }

    async changeCurrency(currency: string, userId: number) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        user.preferences = {
            ...user.preferences,
            currency: currency
        };
        await user.save();
    }

    async resetData(userId: number) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        try {
            const result = await this.sequelize.transaction(async (t) => {
                await this.transactionService.reset(userId, t);
                await this.relatedUserService.reset(userId, t);
                await this.categoryService.reset(userId, t);
                await this.walletService.reset(userId, t);

                await User.update({
                    totalBalance: 0,
                    totalLoan: 0,
                    totalDebt: 0,
                }, {
                    where: { id: userId },
                    transaction: t
                })
            })

            return { result: true }
        } catch (error) {
            throw new BadRequestException('Failed to reset user data');
        }
    }
}
