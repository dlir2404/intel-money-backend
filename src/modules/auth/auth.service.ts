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

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
        private readonly categoryService: CategoryService,
        private readonly walletService: WalletService,
        private readonly sequelize: Sequelize,
    ) { };

    async register(body: RegisterRequest) {
        try {
            const result = await this.sequelize.transaction(async (t) => {
                const {timezone, ...rest}: any = body;

                if (timezone){
                    rest.preferences = {
                        timezone
                    }
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
}
