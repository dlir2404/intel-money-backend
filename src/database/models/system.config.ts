import { Column, DataType, Model, Table } from "sequelize-typescript";

interface AdsConfig {
    //range from 0 to 1
    adProbability: number;

    //in seconds
    minTimeBetweenAds: number;
}

@Table
export class SystemConfig extends Model {
    @Column({
            type: DataType.JSON
    })
    adsConfig: AdsConfig;
}