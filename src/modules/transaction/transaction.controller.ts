import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { TransactionService } from "./transaction.service";

@Controller("transaction")
@ApiTags("Transaction")
export class TransactionController {
    constructor(private readonly transactionService: TransactionService) {}
}