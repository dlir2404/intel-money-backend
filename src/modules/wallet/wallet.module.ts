import { forwardRef, Module } from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { WalletController } from "./wallet.controller";
import { Transaction } from "sequelize";
import { TransactionModule } from "../transaction/transaction.module";

@Module({
    imports: [forwardRef(() => TransactionModule)],
    controllers: [WalletController],
    providers: [WalletService],
    exports: [WalletService]
})
export class WalletModule { }