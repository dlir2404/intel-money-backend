import { BelongsTo, Column, ForeignKey, Model, Table } from "sequelize-typescript";
import { User } from "./user";

@Table({
    timestamps: false
})
export class Wallet extends Model {
    @Column
    name: string;

    @Column({
        allowNull: true
    })
    description: string;

    @Column
    icon: string;

    @Column({
        defaultValue: 0
    })
    balance: number;
    
    @ForeignKey(() => User)
    @Column
    userId: number;

    @BelongsTo(() => User)
    user: User;
}