import { Column, Model, Table, ForeignKey, BelongsTo, DataType } from "sequelize-typescript";
import { User } from "./user";

@Table({
    timestamps: false
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
        defaultValue: 0
    })
    // total amount that user has borrow from this person
    totalLoan: number;

    @Column({
        defaultValue: 0
    })
    // total amount that user has paid to this person
    totalPaid: number;

    @Column({
        defaultValue: 0
    })
    // total amount that user has lent to this person
    totalDebt: number;

    @Column({
        defaultValue: 0
    })
    //total amount that user has collected from this person
    totalCollected: number;
}