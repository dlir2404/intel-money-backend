import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LoginRequest, RegisterRequest } from './auth.dto';
import { User } from 'src/database/models';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from 'src/shared/enums/user';
import { UserService } from '../user/user.service';
import { CategoryService } from '../category/category.service';
import { WalletService } from '../wallet/wallet.service';
import { Sequelize } from 'sequelize-typescript';
import {AppCacheService} from "../cache/cache.service";
import { randomBytes } from 'crypto';
import {MailerService} from "@nestjs-modules/mailer";

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
        private readonly categoryService: CategoryService,
        private readonly walletService: WalletService,
        private readonly sequelize: Sequelize,
        private readonly cacheService: AppCacheService,
        private mailerService: MailerService,
    ) { };

    async register(body: RegisterRequest) {
        try {
            const result = await this.sequelize.transaction(async (t) => {
                const { timezone, ...rest }: any = body;

                rest.preferences = {
                    timezone: timezone || 'UTC',
                }

                const user = await this.userService.createUser({
                    ...rest,
                    role: UserRole.NORMAL_USER
                }, t);


                await this.categoryService.createDefaultCategories(user.id, t);
                await this.walletService.createDefaultWallets(user.id, t);

                return user;
            });

            const payload = {
                sub: result.dataValues.id,
                role: result.dataValues.role,
                iat: Date.now(),
                iss: 'Intel Money'
            };

            return {
                accessToken: await this.jwtService.signAsync(payload, { expiresIn: '1d' }),
                refreshToken: await this.jwtService.signAsync(payload, { expiresIn: '60d' })
            }

        } catch (error) {
            throw new BadRequestException(`Failed to create income transaction: ${error.message}`);
        }
    }

    async login({ email, password }: LoginRequest) {
        const user = await User.findOne({ where: { email: email, role: UserRole.NORMAL_USER } });

        if (!user) {
            throw new NotFoundException('User not found')
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            throw new ForbiddenException('Email or password not match')
        }

        const payload = {
            sub: user.id,
            role: user.role,
            iat: Date.now(),
            iss: 'Intel Money'
        };

        return {
            accessToken: await this.jwtService.signAsync(payload, { expiresIn: '1d' }),
            refreshToken: await this.jwtService.signAsync(payload, { expiresIn: '60d' })
        }
    }

    async refreshToken(refreshToken: string) {
        const decoded = this.jwtService.verify(refreshToken);

        const payload = {
            sub: decoded.sub,
            role: decoded.role,
            iat: Date.now(),
            iss: 'Intel Money'
        };

        return {
            accessToken: await this.jwtService.signAsync(payload, { expiresIn: '1d' }),
            refreshToken: await this.jwtService.signAsync(payload, { expiresIn: '60d' })
        }
    }

    async getMe(userId: number) {
        return User.findOne({ where: { id: userId, role: UserRole.NORMAL_USER }, raw: true })
    }

    async forgotPassword(email: string){
        const user = await User.findOne({ where: { email: email, role: UserRole.NORMAL_USER } });

        if (!user) {
            throw new NotFoundException('User not found')
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const key = this.generateKey(user.id, 'otp');
        await this.cacheService.set(key, { otp }, 15 * 60);

        await this.mailerService.sendMail({
            to: email,
            subject: 'Reset Password',
            template: './reset-password',
            context: {
                name: user.name || user.email,
                otp,
                ttl: 15,
            },
        })

        return {
            message: 'OTP sent to your email',
        }
    }

    async verifyOtp(email: string, otp: string) {
        const user = await User.findOne({ where: { email: email, role: UserRole.NORMAL_USER } });

        if (!user) {
            throw new NotFoundException('User not found')
        }

        const key = this.generateKey(user.id, 'otp');
        const cachedData = await this.cacheService.get(key) as {otp: string};

        if (!cachedData) {
            throw new BadRequestException('OTP expired');
        }

        if (!cachedData.otp || cachedData.otp !== otp) {
            throw new BadRequestException('Invalid OTP');
        }

        const token = randomBytes(32).toString('hex');

        const cachedKey = this.generateKey(user.id, 'token');
        await this.cacheService.del(key);
        await this.cacheService.set(cachedKey, { token }, 15 * 60);

        return {
            resetToken: token,
        }
    }

    async resetPassword(email: string, token: string, password: string) {
        const user = await User.findOne({ where: { email: email, role: UserRole.NORMAL_USER } });

        if (!user) {
            throw new NotFoundException('User not found')
        }

        const key = this.generateKey(user.id, 'token');
        const cachedData = await this.cacheService.get(key) as {token: string};
        if (!cachedData) {
            throw new BadRequestException('Token expired');
        }

        if (!cachedData.token || cachedData.token !== token) {
            throw new BadRequestException('Invalid token');
        }

        await this.userService.setNewPassword(user, password);
        await this.cacheService.del(key);

        return {
            message: 'Password reset successfully',
        }
    }

    private generateKey(userId: number, type: 'otp' | 'token') {
        return `auth:${userId}:${type}`;
    }
}
