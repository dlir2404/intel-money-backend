import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { User } from 'src/database/models';
import { UserService } from '../user/user.service';
import { UserRole } from 'src/shared/enums/user';
import { RegisterRequest } from './auth.dto';

@Injectable()
export class GoogleAuthService {
    private client: OAuth2Client;
    private googleClientId?: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly userService: UserService
    ) {
        this.googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID')
        this.client = new OAuth2Client(this.googleClientId);
    }

    async login(idToken: string) {
        const credentials = await this.validateIdToken(idToken);

        let user = await User.findOne({ where: { email: credentials.email } });

        if (!user) {
            const randomPassword = '12333';

            let body = {
                ...credentials,
                password: randomPassword
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
        return await this.userService.createUser({
            ...body,
            role: UserRole.NORMAL_USER
        })
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