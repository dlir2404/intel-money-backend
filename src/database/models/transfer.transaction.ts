import { BelongsTo, Column, ForeignKey, Model, Table } from "sequelize-typescript";
import { GeneralTransaction } from "./general.transaction";
import { Wallet } from "./wallet";

@Table({ timestamps: false })
export class TransferTransaction extends Model {
    @ForeignKey(() => GeneralTransaction)
    @Column
    generalTransactionId: number;

    @BelongsTo(() => GeneralTransaction)
    generalTransaction: GeneralTransaction;

    @ForeignKey(() => Wallet)
    @Column
    destinationWalletId: number;

    @BelongsTo(() => Wallet)
    destinationWallet: Wallet;
}