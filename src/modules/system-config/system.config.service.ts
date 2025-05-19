import { Injectable, NotFoundException } from "@nestjs/common";
import { SystemConfig } from "src/database/models";

@Injectable()
export class SystemConfigService {
    constructor() { }

    async getAllSystemConfig() {
        const configs = await SystemConfig.findAll({
            raw: true,
        })

        return configs;
    }

    async createSystemConfig(body: any) {
        const { key, value } = body;

        const config = await SystemConfig.create({
            key,
            value
        });

        return config;
    }

    async updateSystemConfig(id: number, value: string) {
        const config = await SystemConfig.findByPk(id);

        if (!config) {
            throw new NotFoundException("Config not found");
        }

        config.value = value;
        await config.save();

        return config;
    }

    async deleteSystemConfig(id: number) {
        const config = await SystemConfig.findByPk(id);

        if (!config) {
            throw new NotFoundException("Config not found");
        }

        await config.destroy();

        return config;
    }
}