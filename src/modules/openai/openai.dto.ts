import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import OpenAI from "openai";
import {GeneralTransactionResponse} from "../transaction/transaction.dto";

export class CompletionRequestDto {
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
    model?: string = 'gpt-4o-mini';
    maxTokens?: number;
    temperature?: number;
    schema?: Record<string, unknown>;
}


export class ExtractTransactionInfoResponse {
    @ApiProperty()
    amount: number;

    @ApiProperty()
    categoryId: number;

    @ApiProperty()
    walletId: number;
}


export class ExtractTransactionInfoRequest {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    text: string;
}

export class RegisterTransactionFromChatRequest {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    text: string;
}

export class RegisterTransactionFromChatResponse {
    @ApiProperty({
        type: [GeneralTransactionResponse]
    })
    transactions: GeneralTransactionResponse[];

    @ApiProperty()
    advice: string;
}