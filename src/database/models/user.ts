import { Exclude } from "class-transformer";
import { Model, Column, Table, DataType } from "sequelize-typescript";
import { UserRole } from "src/shared/enums/user";

@Table
export class User extends Model {
    @Column
    name: string
    
    @Column
    email: string

    @Column
    @Exclude()
    password: string


    @Column({ allowNull: true })
    phone: string

    @Column({ allowNull: true })
    picture: string

    @Column({
        defaultValue: 0
    })
    totalBalance: number

    @Column({
        defaultValue: 0
    })
    totalLoan: number

    @Column({
        defaultValue: 0
    })
    totalDebt: number

    @Column({
        type: DataType.ENUM(...Object.values(UserRole)),
        defaultValue: UserRole.NORMAL_USER,
    })
    role: UserRole
}