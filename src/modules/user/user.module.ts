import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AdminUserController } from './admin.user.controller';
import { AdminUserService } from './admin.user.service';

@Module({
  controllers: [UserController, AdminUserController],
  providers: [UserService, AdminUserService],
  exports: [UserService]
})
export class UserModule {}
