import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: ['https://nexus-talk-upload.vercel.app', 'http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Set global prefix
  app.setGlobalPrefix('api');

  // Enable validation pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Technical Test API')
    .setDescription('API documentation for Technical Test')
    .setVersion('1.0')
    .addTag('technical-test')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('reference', app, documentFactory);
  app.setGlobalPrefix('api');
  await app.listen(process.env.DEV_PORT ?? 3000, '0.0.0.0');

  logger.log(`Application is running on: ${await app.getUrl()}`);
};

bootstrap(); 
