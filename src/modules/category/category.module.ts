import { forwardRef, Module } from "@nestjs/common";
import { CategoryService } from "./category.service";
import { CategoryController } from "./category.controller";
import { TransactionModule } from "../transaction/transaction.module";

@Module({
    imports: [
        forwardRef(() => TransactionModule),
    ],
    controllers: [CategoryController],
    providers: [CategoryService],
    exports: [CategoryService]
})
export class CategoryModule {}