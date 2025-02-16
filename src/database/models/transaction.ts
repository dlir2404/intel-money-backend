import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Wallet } from "./wallet";
import { Category } from "./category";
import { TransactionType } from "src/shared/enums/transaction";
import { RelatedUser } from "./related.user";

@Table
export class Transaction extends Model{
    @Column({
        type: DataType.ENUM(...Object.values(TransactionType)),
        allowNull: false
    })
    type: string;

    @Column({
        type: DataType.DECIMAL(19, 4),
        allowNull: false
    })
    amount: number;

    @Column
    description: string;

    @ForeignKey(() => Wallet)
    @Column
    walletId: number;

    @BelongsTo(() => Wallet)
    wallet: Wallet;

    @ForeignKey(() => Category)
    @Column
    categoryId: number;

    @BelongsTo(() => Category)
    category: Category;

    @ForeignKey(() => Wallet)
    @Column({ allowNull: true })
    recipientWalletId: number;

    @BelongsTo(() => Wallet, 'recipientWalletId')
    recipientWallet: Wallet;

    @Column({ defaultValue: false })
    excludeFromReport: boolean;

    @ForeignKey(() => RelatedUser)
    @Column({ allowNull: true })
    relatedUserId: number;

    @BelongsTo(() => RelatedUser)
    relatedUser: RelatedUser;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW
    })
    transactionDate: Date;
}