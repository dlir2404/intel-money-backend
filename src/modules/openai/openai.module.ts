import { Module } from "@nestjs/common";
import { OpenAiController } from "./openai.controller";
import { OpenAiService } from "./openai.service";
import { CategoryModule } from "../category/category.module";
import { WalletModule } from "../wallet/wallet.module";

@Module({
    imports: [CategoryModule, WalletModule],
    controllers: [OpenAiController],
    providers: [OpenAiService],
})
export class OpenAiModule {}