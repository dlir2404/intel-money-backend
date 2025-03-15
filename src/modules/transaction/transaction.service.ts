import { Injectable } from "@nestjs/common";
import { GeneralTransaction } from "src/database/models";
import { TransactionType } from "src/shared/enums/transaction";
import { CreateGeneralTrans } from "src/shared/types/transactions/general";
import { CreateIncomeRequest } from "./transaction.dto";

@Injectable()
export class TransactionService {
    async createGeneralTransaction(params: CreateGeneralTrans) {
        return await GeneralTransaction.create({
            ...params
        });
    }

    async createIncome(body: CreateIncomeRequest, userId: number) {
        return await this.createGeneralTransaction({
            type: TransactionType.INCOME,
            ...body,
            userId
        });
    }
}