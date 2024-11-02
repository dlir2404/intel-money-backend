import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private readonly _reflector: Reflector,
        private jwtService: JwtService,
        private readonly configService: ConfigService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const rolesFunction = this._reflector.get<string[]>(
            'roles',
            context.getHandler(),
        );
        const rolesClass = this._reflector.get<string[]>(
            'roles',
            context.getClass(),
        );

        const roles = rolesFunction || rolesClass;
        if (!roles) {
            return true;
        }

        const request = context.switchToHttp().getRequest()

        const token = this.extractTokenFromHeader(request)

        if (!token) {
            throw new UnauthorizedException();
        }

        try {
            const payload = await this.jwtService.verifyAsync(
                token,
                {
                    secret: this.configService.get<string>('JWT_SECRET')
                }
            );

            if (!roles.includes(payload.role)) {
                throw new UnauthorizedException('User not admin')
            }

            request['user'] = payload;
        } catch {
            throw new UnauthorizedException();
        }
        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
