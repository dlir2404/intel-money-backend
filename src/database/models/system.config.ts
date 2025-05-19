import { Column, Model, Table } from "sequelize-typescript";

@Table
export class SystemConfig extends Model {
    @Column
    key: string;

    @Column
    value: string;
}