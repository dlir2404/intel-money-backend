import { applyDecorators, BadRequestException, createParamDecorator, ExecutionContext, SetMetadata, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { UserRole } from "../enums/user";
import { AdminGuard } from "src/modules/auth/guards/admin";
import { UserGuard } from "src/modules/auth/guards/normal_user";
import { RolesGuard } from "src/modules/auth/guards/role";

export const User = createParamDecorator(
    async (data: any, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const auth = request.user;
        return data ? auth?.[data] : auth;
    },
);

export const CurrentUserId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const userId = request.user?.sub || request.user?.id;
        if (!userId) {
            throw new BadRequestException('Missing user in the request');
        }
        return userId;
    },
);

export function AdminAuth() {
    return applyDecorators(
        UseGuards(AdminGuard),
        ApiBearerAuth(),
        ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    );
}

export function UserAuth() {
    return applyDecorators(
        UseGuards(UserGuard),
        ApiBearerAuth(),
        ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    );
}

export function AuthRequired(roles?: UserRole[]) {
    if (roles && roles.length > 0) {
        return applyDecorators(
            SetMetadata('roles', roles),
            UseGuards(RolesGuard),
            ApiBearerAuth(),
            // ApiBearerAuth(SWAGGER_ACCESS_TOKEN_KEY),
            ApiUnauthorizedResponse({ description: 'Unauthorized' }),
        );
    }
    return applyDecorators(
        // UseGuards(AuthGuard),
        ApiBearerAuth(),
        // ApiBearerAuth(SWAGGER_ACCESS_TOKEN_KEY),
        ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    );
}