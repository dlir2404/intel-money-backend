import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Wallet } from "./wallet";
import { Category } from "./category";
import { TransactionType } from "src/shared/enums/transaction";
import { User } from "./user";

@Table({})
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
        type: DataType.TEXT,
        get() {
            const rawValue = this.getDataValue('images');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value: string[]) {
            this.setDataValue('images', JSON.stringify(value || []));
        }
    })
    images: string[];
}