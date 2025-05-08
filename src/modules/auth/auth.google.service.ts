import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { User } from 'src/database/models';
import { UserService } from '../user/user.service';
import { UserRole } from 'src/shared/enums/user';
import { GoogleLoginRequest, RegisterRequest } from './auth.dto';
import { Sequelize } from 'sequelize-typescript';
import { CategoryService } from '../category/category.service';
import { WalletService } from '../wallet/wallet.service';


@Injectable()
export class GoogleAuthService {
    private client: OAuth2Client;
    private googleClientId?: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
        private readonly sequelize: Sequelize,
        private readonly categoryService: CategoryService,
        private readonly walletService: WalletService,
    ) {
        this.googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID')
        this.client = new OAuth2Client(this.googleClientId);
    }

    async login({idToken, timezone}: GoogleLoginRequest) {
        const credentials = await this.validateIdToken(idToken);

        let user = await User.findOne({ where: { email: credentials.email } });

        if (!user) {
            const randomPassword = '12333';

            let body = {
                ...credentials,
                password: randomPassword,
                preferences: {
                    timezone: timezone || 'UTC',
                }
            }
            user = await this.register(body);
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

    async register(body: RegisterRequest) {
        try {
            const result = await this.sequelize.transaction(async (t) => {
                const user = await this.userService.createUser({
                    ...body,
                    role: UserRole.NORMAL_USER
                }, t);


                await this.categoryService.createDefaultCategories(user.id, t);
                await this.walletService.createDefaultWallets(user.id, t);

                return user;
            });

            return result;

        } catch (error) {
            throw new BadRequestException(`Failed to create income transaction: ${error.message}`);
        }
    }


    async validateIdToken(idToken: string) {
        try {
            const ticket = await this.client.verifyIdToken({
                idToken,
                audience: this.googleClientId,
            });
            const payload = ticket.getPayload();

            return {
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
            };
        } catch (error) {
            throw new BadRequestException('Invalid ID token');
        }
    }
}