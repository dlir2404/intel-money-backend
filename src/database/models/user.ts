import { Exclude } from "class-transformer";
import { Model, Column, Table, DataType } from "sequelize-typescript";
import { UserRole } from "src/shared/enums/user";

@Table
export class User extends Model {
    @Column
    username: string

    @Column
    @Exclude()
    password: string

    @Column({ allowNull: true })
    email: string

    @Column({ allowNull: true })
    phone: string

    @Column({
        type: DataType.ENUM(...Object.values(UserRole)),
        defaultValue: UserRole.NORMAL_USER,
    })
    role: UserRole
}