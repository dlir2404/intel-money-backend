import {CallHandler, ExecutionContext, Injectable, NestInterceptor} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import * as dayjs from 'dayjs';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable()
export class TelegramLoggerInterceptor implements NestInterceptor {
    private botToken: string;
    private chatId: string;

    constructor(private readonly configService: ConfigService) {
        this.botToken = configService.get<string>("TELEGRAM_BOT_TOKEN");
        this.chatId = configService.get<string>("TELEGRAM_ERROR_CHAT_ID");
    }

    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        const req = context.switchToHttp().getRequest();

        const method = req.method;
        const url = req.originalUrl;
        const headers = req.headers;
        const params = req.params;
        const body = req.body;
        const now = dayjs().format("YYYY-MM-DD HH:mm:ss");

        const bearerToken = headers['authorization'];

        return next.handle().pipe(
            catchError(async (err) => {
                const text = `
    🚨 *Intel Money Error Alert*
    🕒 Time: ${now}
    🔗 URL: ${method} ${url}
    🧾 Params: \`${JSON.stringify(params)}\`
    📦 Body: \`${JSON.stringify(body)}\`
    🛡️ Authorization: \`${bearerToken}\`
    ❌ Error: \`${err.message}\`
    \`\`\`
    ${err.stack}
    \`\`\`
`.trim();

                const telegramUrl = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

                await fetch(telegramUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: this.chatId,
                        text,
                        parse_mode: 'Markdown',
                    }),
                });

                return throwError(() => err);
            })
        );
    }
}