import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateRequest } from "./wallet.dto";
import { Wallet } from "src/database/models";


@Injectable()
export class WalletService {
    
    async create(body: CreateRequest, userId: number) {
        return await Wallet.create({ ...body, userId });
    }

    async update(id: number, userId: number, body: CreateRequest) {
        const wallet = await Wallet.findOne({
            where: { id, userId }
        })
        
        if (!wallet) {
            throw new NotFoundException("Wallet not found");
        }

        return await wallet.update(body);
    }
    
    async delete(id: number, userId: number) {
        const wallet = await Wallet.findOne({
            where: { id, userId }
        })
        
        if (!wallet) {
            throw new NotFoundException("Wallet not found");
        }

        return await wallet.destroy();
    }

    async findAll(userId: number) {
        return await Wallet.findAll({
            where: { userId }
        });
    }
}