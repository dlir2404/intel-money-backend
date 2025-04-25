import { Module } from "@nestjs/common";
import { TransactionController } from "./transaction.controller";
import { TransactionService } from "./transaction.service";
import { UserModule } from "../user/user.module";
import { WalletModule } from "../wallet/wallet.module";
import { CategoryModule } from "../category/category.module";
import { RelatedUserModule } from "../related-user/related-user.module";
import { StatisticModule } from "../statistic/statistic.module";

@Module({
    imports: [
        UserModule, 
        WalletModule, 
        CategoryModule, 
        RelatedUserModule,
        StatisticModule
    ],
    controllers: [TransactionController],
    providers: [TransactionService]
})
export class TransactionModule {}