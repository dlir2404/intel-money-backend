import { Injectable, NotFoundException } from "@nestjs/common";
import { SystemConfig } from "src/database/models";
import { UpdateSystemConfigDto } from "./dto";

@Injectable()
export class SystemConfigService {
    constructor() { }

    async getSysConfig() {
        const config = await SystemConfig.findOne({
            raw: true,
        })

        return config;
    }

    async updateSystemConfig(body: UpdateSystemConfigDto) {
        const config = await SystemConfig.findOne();

        if (!config) {
            throw new NotFoundException("Config not found");
        }

        if (body.adsConfig) {
            config.adsConfig = body.adsConfig
        }
        
        await config.save();

        return config;
    }
}