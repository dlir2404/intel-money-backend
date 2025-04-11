import { Body, Controller, Post } from "@nestjs/common";
import { OpenAiService } from "./openai.service";
import { ExtractTransactionInfoRequest, ExtractTransactionInfoResponse } from "./openai.dto";
import { CurrentUserId, UserAuth } from "src/shared/decorators/auth";
import { ApiResponse } from "@nestjs/swagger";

@Controller('ai/openai')
export class OpenAiController {
    constructor(private readonly openAiService: OpenAiService) {}

    @Post('extract-transaction-info')
    @UserAuth()
    @ApiResponse({
        status: 200,
        description: 'Extract transaction information from text',
        type: ExtractTransactionInfoResponse,
    })
    async extractTransactionInfo(@Body() request: ExtractTransactionInfoRequest, @CurrentUserId() userId: number) {
        return await this.openAiService.extractTransactionInfo(request.text, userId);
    }
}