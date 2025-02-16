import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { User, RelatedUser, Category, Wallet, Transaction } from './database/models';
import { RelatedUserModule } from './modules/related-user/related-user.module';
import { CategoryModule } from './modules/category/category.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { TransactionModule } from './modules/transaction/transaction.module';

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
        models: [User, RelatedUser, Category, Wallet, Transaction],
        synchronize: true,
        // sync: { force: true },
        logging: console.log,
      })
    }),
    AuthModule, 
    UserModule,
    RelatedUserModule,
    CategoryModule,
    WalletModule,
    TransactionModule
  ],
})
export class AppModule {}
