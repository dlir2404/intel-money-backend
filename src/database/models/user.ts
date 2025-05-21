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

    @Column({ allowNull: false, defaultValue: false })
    isVip: boolean

    //this can be a UTC ISO 8601 string or "lifetime"
    @Column({ allowNull: true })
    vipExpirationDate: string

    @Column({
        type: DataType.DECIMAL(17, 2),
        allowNull: false,
        defaultValue: 0
    })
    totalBalance: number

    @Column({
        type: DataType.DECIMAL(17, 2),
        defaultValue: 0,
        allowNull: false
    })
    totalLoan: number

    @Column({
        type: DataType.DECIMAL(17, 2),
        defaultValue: 0,
        allowNull: false
    })
    totalDebt: number

    @Column({
        type: DataType.ENUM(...Object.values(UserRole)),
        defaultValue: UserRole.NORMAL_USER,
    })
    role: UserRole

    @Column({
        type: DataType.JSON,
        defaultValue: {
            timezone: "Asia/Ho_Chi_Minh",
            currency: "VND",
        }
    })
    preferences: any
}