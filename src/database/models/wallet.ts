import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { User } from "./user";

@Table({
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
        type: DataType.DECIMAL(17, 2),
        defaultValue: 0,
        allowNull: false
    })
    balance: number;
    
    @ForeignKey(() => User)
    @Column
    userId: number;

    @BelongsTo(() => User)
    user: User;
}