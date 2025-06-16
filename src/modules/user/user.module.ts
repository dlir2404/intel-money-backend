import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AdminUserController } from './admin.user.controller';
import { AdminUserService } from './admin.user.service';
import { TransactionModule } from '../transaction/transaction.module';
import { WalletModule } from '../wallet/wallet.module';
import { RelatedUserModule } from '../related-user/related-user.module';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [
    forwardRef(() => TransactionModule),
    forwardRef(() => WalletModule),
    forwardRef(() => CategoryModule),
    RelatedUserModule
  ],
  controllers: [UserController, AdminUserController],
  providers: [UserService, AdminUserService],
  exports: [UserService]
})
export class UserModule {}
