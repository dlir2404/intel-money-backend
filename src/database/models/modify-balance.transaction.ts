import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { GeneralTransaction } from "./general.transaction";

@Table({ timestamps: false })
export class ModifyBalanceTransaction extends Model {
    @ForeignKey(() => GeneralTransaction)
    @Column
    generalTransactionId: number;

    @BelongsTo(() => GeneralTransaction)
    generalTransaction: GeneralTransaction;

    @Column({
        type: DataType.DECIMAL(17, 2),
        defaultValue: 0,
        allowNull: false
    })
    newRealBalance: number;
}