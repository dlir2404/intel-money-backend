import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from 'src/database/models';
import { CreateUserRequest } from './user.dto';
import * as bcrypt from 'bcrypt';
import { SALT_OR_ROUNDS } from 'src/shared/constants';

@Injectable()
export class UserService {
    async createUser(body : CreateUserRequest) {
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
        })

        return user;
    }
}
