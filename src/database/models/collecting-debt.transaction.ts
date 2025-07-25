import { BelongsTo, Column, ForeignKey, Model, Table } from "sequelize-typescript";
import { GeneralTransaction } from "./general.transaction";
import { RelatedUser } from "./related.user";

@Table({ timestamps: false })
export class CollectingDebtTransaction extends Model {
    @ForeignKey(() => GeneralTransaction)
    @Column
    generalTransactionId: number;

    @BelongsTo(() => GeneralTransaction)
    generalTransaction: GeneralTransaction;

    @ForeignKey(() => RelatedUser)
    @Column
    borrowerId: number;

    @BelongsTo(() => RelatedUser)
    borrower: RelatedUser;
}