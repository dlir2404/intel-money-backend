import { Column, Model, Table, ForeignKey, BelongsTo, DataType } from "sequelize-typescript";
import { User } from "./user";

@Table({
})
export class RelatedUser extends Model {
    @Column
    name: string;

    @Column({ allowNull: true })
    phone: string;

    @Column({ allowNull: true })
    email: string;

    @ForeignKey(() => User)
    @Column
    userId: number;

    @BelongsTo(() => User)
    user: User;

    @Column({
        type: DataType.DECIMAL(17, 2),
        defaultValue: 0,
        allowNull: false
    })
    // total amount that user has borrow from this person
    totalLoan: number;

    @Column({
        type: DataType.DECIMAL(17, 2),
        defaultValue: 0,
        allowNull: false
    })
    // total amount that user has paid to this person
    totalPaid: number;

    @Column({
        type: DataType.DECIMAL(17, 2),
        defaultValue: 0,
        allowNull: false
    })
    // total amount that user has lent to this person
    totalDebt: number;

    @Column({
        type: DataType.DECIMAL(17, 2),
        defaultValue: 0,
        allowNull: false
    })
    //total amount that user has collected from this person
    totalCollected: number;
}