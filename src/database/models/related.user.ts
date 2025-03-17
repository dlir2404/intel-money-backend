import { Column, Model, Table, ForeignKey, BelongsTo } from "sequelize-typescript";
import { User } from "./user";
import { Col } from "sequelize/types/utils";

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

    @Column
    totalLoan: number;

    @Column
    totalBorrow: number;
}