import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateRequest } from "./wallet.dto";
import { Wallet } from "src/database/models";


@Injectable()
export class WalletService {
    
    async create(body: CreateRequest, userId: number) {
        const res =  await Wallet.create({ ...body, userId });
        return res.dataValues;
    }

    async update(id: number, userId: number, body: CreateRequest) {
        const wallet = await Wallet.findOne({
            where: { id, userId }
        })
        
        if (!wallet) {
            throw new NotFoundException("Wallet not found");
        }

        const res = await wallet.update(body);
        return res.dataValues;
    }
    
    async delete(id: number, userId: number) {
        const wallet = await Wallet.findOne({
            where: { id, userId }
        })
        
        if (!wallet) {
            throw new NotFoundException("Wallet not found");
        }

        await wallet.destroy();

        return { result: true};
    }

    async findAll(userId: number) {
        return await Wallet.findAll({
            where: { userId },
            raw: true
        },);
    }
}