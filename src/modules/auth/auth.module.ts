import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminAuthController } from './admin.auth.controller';
import { AdminAuthService } from './admin.auth.service';

@Module({
  imports: [
    UserModule, 
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      global: true
    }),
  ],
  controllers: [AuthController, AdminAuthController],
  providers: [AuthService, AdminAuthService]
})
export class AuthModule {}
