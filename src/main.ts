import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * Configuration of the Swagger document
   */
  const config = new DocumentBuilder()
    .setTitle('patient service')
    .setDescription('A service for patient management')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  /**
   * Start the server
   */
  try {
    await app.listen(process.env.PORT ?? 3000);
  } catch (error) {
    console.error(error);
  }
  return;
}

bootstrap();
