import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';  // Thay đổi import
import { getConnectionToken } from '@nestjs/sequelize';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Base backend')
    .setDescription('The base API description')
    .addBearerAuth()
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, documentFactory);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }))

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get('Reflector'), {
      excludeExtraneousValues: false,
      exposeUnsetFields: true,
    })
  );

  const sequelize = app.get<Sequelize>(getConnectionToken());
  await sequelize.sync();

  const timezoneOffset = -new Date().getTimezoneOffset() / 60;
  Logger.log(`Server timezone offset (UTC): ${timezoneOffset >= 0 ? '+' : '-'}${timezoneOffset}:00`, 'Timezone');
  
  await app.listen(3002);
}
bootstrap();
