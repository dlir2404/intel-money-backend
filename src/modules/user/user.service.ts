import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from 'src/database/models';
import { CreateUserRequest } from './user.dto';
import * as bcrypt from 'bcrypt';
import { SALT_OR_ROUNDS } from 'src/shared/constants';
import { Transaction } from 'sequelize';

@Injectable()
export class UserService {
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

}
