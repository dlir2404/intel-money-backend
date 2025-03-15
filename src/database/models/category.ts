import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from "sequelize-typescript";
import { User } from "./user";
import { CategoryType } from "src/shared/enums/category";
import { Col } from "sequelize/types/utils";

@Table({
    timestamps: false
})
export class Category extends Model {
    @Column
    name: string;

    @Column
    icon: string;

    @Column({
        type: DataType.ENUM(...Object.values(CategoryType)),
        allowNull: false
    })
    type: CategoryType;

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: true
    })
    editable: boolean;

    @ForeignKey(() => Category)
    @Column({ allowNull: true })
    parentId: number;

    @BelongsTo(() => Category, { foreignKey: 'parentId', as: 'parent' })
    parent: Category;

    @HasMany(() => Category, { foreignKey: 'parentId', as: 'children' })
    children: Category[];

    @ForeignKey(() => User)
    @Column
    userId: number;

    @BelongsTo(() => User)
    user: User;
}