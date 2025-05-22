import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { User, RelatedUser, Category, Wallet, GeneralTransaction, BorrowTransaction, TransferTransaction, LendTransaction, SystemConfig } from './database/models';
import { RelatedUserModule } from './modules/related-user/related-user.module';
import { CategoryModule } from './modules/category/category.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { OpenAiModule } from './modules/openai/openai.module';
import { StatisticModule } from './modules/statistic/statistic.module';
import { AppCacheModule } from './modules/cache/cache.module';
import { SystemConfigModule } from './modules/system-config/system.config.module';
import {APP_INTERCEPTOR} from "@nestjs/core";
import {TelegramLoggerInterceptor} from "./shared/interceptors/telegram-logger.interceptor";
import {MailerModule} from "@nestjs-modules/mailer";
import {HandlebarsAdapter} from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import { join } from 'path';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SequelizeModule.forRootAsync({  //cause we use config module => can use forRoot => use process.env instead
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        dialect: 'mysql',
        host: configService.get<string>("DB_HOST"),
        port: +configService.get<number>("DB_PORT"),
        username: configService.get<string>("DB_USERNAME"),
        password: configService.get<string>("DB_PASSWORD"),
        database: configService.get<string>("DB_NAME"),
        models: [User, RelatedUser, Category, Wallet, GeneralTransaction, BorrowTransaction, TransferTransaction, LendTransaction, SystemConfig],
        autoLoadModels: true,
        synchronize: true,
        timezone: '+00:00', // UTC
        dialectOptions: {
          // Đảm bảo DB trả về giá trị DATE/DATETIME/TIMESTAMP là UTC
          // Cho MySQL/MariaDB
          timezone: '+00:00',
          decimalNumbers: true,
        },
        // sync: { force: true },
        // logging: console.log,
        logging: false,
      })
    }),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>("MAIL_HOST") || 'smtp.example.com',
          port: +configService.get<number>("MAIL_PORT") || 587,
          secure: false,
          auth: {
            user: configService.get<string>("MAIL_USER") || 'your-email@example.com',
            pass: configService.get<string>("MAIL_PASSWORD") || 'your-password',
          },
        },
        defaults: {
          from: `${configService.get<string>("MAIL_FROM_NAME") || "No Reply"} <${configService.get<string>("MAIL_FROM_EMAIL") || "<noreply@example.com>"}>`,
        },
        template: {
          dir: join(process.cwd(), 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      })
    }),
    AuthModule,
    UserModule,
    RelatedUserModule,
    CategoryModule,
    WalletModule,
    TransactionModule,
    OpenAiModule,
    AppCacheModule,
    StatisticModule,
    SystemConfigModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TelegramLoggerInterceptor,
    },
  ]
})
export class AppModule { }
