import { BelongsTo, Column, DataType, ForeignKey, HasOne, Model, Table } from "sequelize-typescript";
import { Wallet } from "./wallet";
import { Category } from "./category";
import { TransactionType } from "src/shared/enums/transaction";
import { User } from "./user";
import { LendTransaction } from "./lend.transaction";
import { BorrowTransaction } from "./borrow.transaction";
import { TransferTransaction } from "./transfer.transaction";
import { ModifyBalanceTransaction } from "./modify-balance.transaction";
import { CollectingDebtTransaction } from "./collecting-debt.transaction";
import { RepaymentTransaction } from "./repayment.transaction";

@Table({ timestamps: false })
export class GeneralTransaction extends Model{
    @Column({
        type: DataType.ENUM(...Object.values(TransactionType)),
        allowNull: false
    })
    type: TransactionType;

    @Column({
        type: DataType.DECIMAL(17, 2),
        defaultValue: 0,
        allowNull: false
    })
    amount: number;

    @ForeignKey(() => Category)
    @Column
    categoryId: number;

    @BelongsTo(() => Category)
    category: Category;

    @Column
    description: string;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW
    })
    transactionDate: string;

    @ForeignKey(() => Wallet)
    @Column
    sourceWalletId: number;

    @BelongsTo(() => Wallet)
    sourceWallet: Wallet;

    @ForeignKey(() => User)
    @Column
    userId: number;

    @BelongsTo(() => User)
    user: User;

    @Column({ defaultValue: false })
    notAddToReport: boolean;

    @Column({
        type: DataType.STRING(1024),
    })
    image: string;

    @HasOne(() => LendTransaction)
    lendTransaction: LendTransaction;

    @HasOne(() => BorrowTransaction)
    borrowTransaction: BorrowTransaction;

    @HasOne(() => TransferTransaction)
    transferTransaction: TransferTransaction;

    @HasOne(() => ModifyBalanceTransaction)
    modifyBalanceTransaction: ModifyBalanceTransaction;

    @HasOne(() => CollectingDebtTransaction)
    collectingDebtTransaction: CollectingDebtTransaction;

    @HasOne(() => RepaymentTransaction)
    repaymentTransaction: RepaymentTransaction;
}