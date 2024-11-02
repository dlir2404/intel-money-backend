import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LoginRequest, RegisterRequest } from './auth.dto';
import { User } from 'src/database/models';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from 'src/shared/enums/user';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UserService
    ) {};

    async register(body: RegisterRequest) {
        return this.userService.createUser({...body, role: UserRole.NORMAL_USER});
    }

    async login({username, password}: LoginRequest) {
        const user = await User.findOne({ where: { username: username, role: UserRole.NORMAL_USER }});

        if (!user){
            throw new NotFoundException('User not found')
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch){
            throw new ForbiddenException('Username or password not match')
        }

        const payload = { sub: user.id, role: user.role };

        return { token: await this.jwtService.signAsync(payload) }
    }

    async getMe(userId: number) {
        return User.findOne({ where: { id: userId, role: UserRole.NORMAL_USER }, raw: true})
    }
}
