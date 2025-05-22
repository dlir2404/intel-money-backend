import {BadRequestException, Injectable, InternalServerErrorException} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import OpenAI from "openai";
import {CompletionRequestDto} from "./openai.dto";
import {CategoryService} from "../category/category.service";
import {WalletService} from "../wallet/wallet.service";
import {ChatCompletionTool} from "openai/src/resources/chat/completions/completions";
import {TransactionService} from "../transaction/transaction.service";
import {GeneralTransactionResponse} from "../transaction/transaction.dto";
import {GeneralTransaction} from "src/database/models";

@Injectable()
export class OpenAiService {
    private readonly openai: OpenAI;

    constructor(
        private readonly configService: ConfigService,
        private readonly categoryService: CategoryService,
        private readonly walletService: WalletService,
        private readonly transactionService: TransactionService,
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
            const {messages, model = 'gpt-4o-mini', maxTokens, temperature, schema} = requestDto;

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
        } catch (error) {
            throw new InternalServerErrorException(`Failed to parse response: ${error.message}. Response: ${response.content}`);
        }
    }

    async registerTransactionFromChat(text: string, userId: number) {
        const userCategoryList = await this.categoryService.getAllToJson(userId);
        const userWalletList = await this.walletService.getAllToJson(userId);

        let tools: Array<ChatCompletionTool> = [
            {
                type: 'function',
                function: {
                    name: 'create_expense_transaction',
                    parameters: {
                        type: "object",
                        properties: {
                            amount: {type: "number"},
                            categoryId: {type: "number"},
                            description: {type: "string"},
                            transactionDate: {type: "string", description: "transaction date in ISO format"},
                            sourceWalletId: {type: "number"},
                        },
                        required: ["amount", "categoryId", "description", "sourceWalletId"],
                    },
                }
            },
            {
                type: "function",
                function: {
                    name: "create_income_transaction",
                    parameters: {
                        type: "object",
                        properties: {
                            amount: {type: "number"},
                            categoryId: {type: "number"},
                            description: {type: "string"},
                            transactionDate: {type: "string", description: "transaction date in ISO format"},
                            sourceWalletId: {type: "number"},
                        },
                        required: ["amount", "categoryId", "description", "sourceWalletId"],
                    },
                }
            }
        ];

        let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: `You are a helpful assistant that extracts transaction information from text messages of users. 

IMPORTANT: If the text contains information about a single transaction, call the appropriate function EXACTLY ONCE.
If the text clearly mentions multiple separate transactions, then call the appropriate function once for EACH transaction.
DO NOT create duplicate transactions for the same information.

For example:
- "break fast 30k" is ONE transaction - call the function only ONCE
- "I bought groceries for $50 and paid $20 for gas" describes TWO transactions - call the function TWICE

Support numeric formats: 
- k (thousands): e.g., 30k = 30000
- m (millions): e.g., 1.5m = 1500000
- b (billions): e.g., 2b = 2000000000
- tr (triệu): e.g., 1tr = 1000000
- củ (triệu  in Vietnamese): e.g., 1 củ = 1000000
- lít / loét (trăm in Vietnamese): e.g., 1 lít / loét = 100000

Note: only use these categorys & wallets listed below, do not create new ones.
User's available categories: ${userCategoryList}
User's available wallets: ${userWalletList}
If user does not provide time, set transactionDate to now. Now is: ${new Date().toISOString()}
`,
            },
            {
                role: "user",
                content: `From this text: "${text}", extract the transaction information and register it.`,
            },
        ];

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messages,
            tools,
            temperature: 0.1, // Add lower temperature for more consistent results
        });

        if (!response.choices[0].message.tool_calls || response.choices[0].message.tool_calls.length === 0) {
            throw new BadRequestException("Please provide a message valid format (category + amount,...). Ex: 'Buy groceries for 100$ in wallet 1', 'Breakfast 2$',...");
        }

        // Add the assistant's message containing tool_calls to the conversation
        messages.push({
            role: 'assistant',
            content: response.choices[0].message.content || null,
            tool_calls: response.choices[0].message.tool_calls
        });

        // Process tool calls and deduplicate if needed
        const seenTransactions = new Set();
        const uniqueToolCalls = [];

        for (const tool_call of response.choices[0].message.tool_calls) {
            const args = JSON.parse(tool_call.function.arguments);

            // Create a unique identifier for this transaction based on key fields
            const transactionKey = `${tool_call.function.name}:${args.description}:${args.amount}:${args.categoryId}:${args.sourceWalletId}`;

            // Only process this transaction if we haven't seen it before
            if (!seenTransactions.has(transactionKey)) {
                seenTransactions.add(transactionKey);
                uniqueToolCalls.push(tool_call);
            }
        }

        const transactions = [];
        for (const tool_call of uniqueToolCalls) {
            let toolArguments: any = JSON.parse(tool_call.function.arguments);
            if (!toolArguments.transactionDate) {
                toolArguments.transactionDate = new Date();
            }

            let response: GeneralTransaction | Partial<GeneralTransactionResponse>;
            if (tool_call.function.name === "create_expense_transaction") {
                response = await this.transactionService.createExpense({
                    ...toolArguments
                }, userId);
            } else if (tool_call.function.name === "create_income_transaction") {
                response = await this.transactionService.createIncome({
                    ...toolArguments
                }, userId);
            }

            const newTransaction = new GeneralTransactionResponse(response);
            transactions.push(newTransaction);
            messages.push({
                role: 'tool',
                tool_call_id: tool_call.id,
                content: JSON.stringify(newTransaction)
            });
        }

        let schema: Record<string, unknown> = {
            type: "object",
            description: "Advice response",
            properties: {
                advice: {
                    type: "string",
                    description: "An advice for spending money",
                }
            },
            additionalProperties: false,
            required: ["advice"],
        };

        const advice_response = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messages,
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
            transactions: transactions,
            advice: JSON.parse(advice_response.choices[0].message.content)?.advice || "",
            usage: advice_response.usage,
        };
    }
}