import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  // Configuración de OpenAPI / Swagger
  const config = new DocumentBuilder()
    .setTitle('Bank Inc - API de Tarjetas y Transacciones')
    .setDescription(
      'Documentación interactiva de la API bancaria de Bank Inc (CredibanCo). Permite la gestión del ciclo de vida de tarjetas y procesamiento de transacciones financieras.',
    )
    .setVersion('1.0.0')
    .addTag('Cards', 'Emisión, activación, bloqueo, recarga y consulta de tarjetas')
    .addTag('Transactions', 'Procesamiento de compras, consulta y anulación de transacciones')
    .addTag('Clients', 'Gestión de clientes titulares del banco')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description:
          'Ingresa la clave de canal: "admin-bank-key-123" (Admin), "client-app-key-789" (Client), o "merchant-pos-key-456" (Merchant)',
      },
      'x-api-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Bank Inc API Docs',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`=======================================================`);
  logger.log(`🚀 Bank Inc API corriendo exitosamente en el puerto: ${port}`);
  logger.log(`📚 Swagger Docs disponible en: http://localhost:${port}/api/docs`);
  logger.log(`=======================================================`);
}
bootstrap();
