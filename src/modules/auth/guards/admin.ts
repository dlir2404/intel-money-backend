import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Request } from 'express';
import { UserRole } from "src/shared/enums/user";

@Injectable()
export class AdminGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private readonly configService: ConfigService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
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

            if (payload.role !== UserRole.ADMIN){
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