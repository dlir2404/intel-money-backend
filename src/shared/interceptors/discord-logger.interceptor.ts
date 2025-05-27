// telegram-logger.interceptor.ts → đổi tên thành discord-logger.interceptor.ts

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as dayjs from 'dayjs';
import { Observable, catchError, throwError, from, EMPTY } from 'rxjs';

@Injectable()
export class DiscordLoggerInterceptor implements NestInterceptor {
  private webhookUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.webhookUrl = this.configService.get<string>('DISCORD_WEBHOOK_URL');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    const method = req.method;
    const url = req.originalUrl;
    const headers = req.headers;
    const params = req.params;
    const body = req.body;
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    const bearerToken = headers['authorization'];

    return next.handle().pipe(
      catchError((err) => {
        const message = [
  '```ts',
  '🚨 Intel Money Error Alert',
  `🕒 Time: ${now}`,
  `🔗 URL: ${method} ${url}`,
  '',
  `🧾 Params:\n${JSON.stringify(params, null, 2)}`,
  '',
  `📦 Body:\n${JSON.stringify(body, null, 2)}`,
  '',
  `🛡️ Authorization: ${bearerToken || 'N/A'}`,
  '',
  `❌ Error: ${err.message}`,
  '',
  `Stack:\n${err.stack}`,
  '```',
].join('\n');


        from(
          fetch(this.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message }),
          })
        )
          .pipe(catchError(() => EMPTY))
          .subscribe();

        return throwError(() => err);
      }),
    );
  }
}
