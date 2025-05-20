import { Module } from "@nestjs/common";
import { OpenAiController } from "./openai.controller";
import { OpenAiService } from "./openai.service";
import { CategoryModule } from "../category/category.module";
import { WalletModule } from "../wallet/wallet.module";
import {TransactionModule} from "../transaction/transaction.module";

@Module({
    imports: [CategoryModule, WalletModule, TransactionModule],
    controllers: [OpenAiController],
    providers: [OpenAiService],
})
export class OpenAiModule {}