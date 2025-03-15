import { TransactionType } from "src/shared/enums/transaction";

export interface CreateGeneralTrans {
    type: TransactionType;
    amount: number;
    categoryId: number;
    description?: string;
    transactionDate?: string;
    sourceWalletId: number;
    notAddToReport?: boolean;
    images?: string[];
    userId: number;
}