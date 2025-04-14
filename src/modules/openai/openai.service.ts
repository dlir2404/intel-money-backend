import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { CompletionRequestDto } from "./openai.dto";
import { CategoryService } from "../category/category.service";
import { WalletService } from "../wallet/wallet.service";

@Injectable()
export class OpenAiService {
    private readonly openai: OpenAI;
    constructor(
        private readonly configService: ConfigService,
        private readonly categoryService: CategoryService,
        private readonly walletService: WalletService,
    ) {
        const apiKey = this.configService.get<string>("OPENAI_API_KEY");
        if (!apiKey) {
            throw new InternalServerErrorException("OPENAI_API_KEY is not defined in the environment variables.");
        }

        this.openai = new OpenAI({
            apiKey: apiKey,
        });
    }

    async createCompletion(requestDto: CompletionRequestDto) {
        try {
            const { messages, model = 'gpt-4o-mini', maxTokens, temperature, schema } = requestDto;

            const response = await this.openai.chat.completions.create({
                model,
                messages: messages,
                max_tokens: maxTokens,
                temperature: temperature,
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "response_schema",
                        schema: schema,
                        description: "Response schema for the OpenAI API",
                    }
                }
            });

            return {
                content: response.choices[0].message.content,
                usage: response.usage,
            };
        } catch (error) {
            throw new InternalServerErrorException(`Failed to generate completion: ${error.message}`);
        }
    }


    async extractTransactionInfo(text: string, userId: number) {

        const userCategoryList = await this.categoryService.getAllToJson(userId);
        const userWalletList = await this.walletService.getAllToJson(userId);

        let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: `You are a helpful assistant that extracts transaction information from text. Your task is to extract transaction info base on the provided text.
                        The provided text is a result of an image scanning or voice recognition.
                        
                        These are user's categories: ${userCategoryList}.
                        These are user's wallets: ${userWalletList}.`,
            },
            {
                role: "user",
                content: `From this text: "${text}", extract the transaction information.`,
            },
        ]

        let schema: Record<string, unknown> = {
            type: "object",
            description: "Extracted transaction information",
            properties: {
                amount: {
                    type: "number",
                    description: "Transaction amount, set to 0 if not recognized",
                },
                categoryId: {
                    type: "number",
                    description: "Id of the category, set to 0 if not regcognized",
                },
                walletId: {
                    type: "number",
                    description: "Id of the wallet, set to 0 if not regcognized",
                },
                date: {
                    type: "string",
                    description: "Transaction date in ISO format, set to null if not recognized",
                },
                description: {
                    type: "string",
                    description: "Transaction description, set to null if not recognized",
                },
            },
            additionalProperties: false,
            required: ["amount", "category", "wallet", "description"],
        }

        const response = await this.createCompletion({
            messages,
            schema,
        });

        try {
            const parsedResponse = JSON.parse(response.content);
            return parsedResponse;
        }
        catch (error) {
            throw new InternalServerErrorException(`Failed to parse response: ${error.message}. Response: ${response.content}`);
        }
    }
}