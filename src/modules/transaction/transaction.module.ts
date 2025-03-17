import { Module } from "@nestjs/common";
import { TransactionController } from "./transaction.controller";
import { TransactionService } from "./transaction.service";
import { UserModule } from "../user/user.module";
import { WalletModule } from "../wallet/wallet.module";
import { CategoryModule } from "../category/category.module";

@Module({
    imports: [UserModule, WalletModule, CategoryModule],
    controllers: [TransactionController],
    providers: [TransactionService]
})
export class TransactionModule {}