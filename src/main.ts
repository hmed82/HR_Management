import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
// import { ClassSerializerInterceptor } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const config = new DocumentBuilder()
    .setTitle('HR Management API')
    .setDescription(
      'REST API for managing employees, departments, leave requests, payroll, and authentication.',
    )
    .setVersion('1.0')
    .addBearerAuth() // for JWT auth in Swagger UI
    .addTag('Authentication', 'Authentication & authorization')
    .addTag('Users', 'User CRUD')
    .addTag('Departments', 'Operations related to departments')
    .addTag('Employees', 'Operations related to employee records')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  // app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));//global interceptor i used before createing my own SerializeInterceptor

  // Enable CORS with options from environment variables or defaults

  // app.enableCors({
  //   origin: configService.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000',
  //   methods: configService.get<string>('CORS_METHODS') ?? 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //   allowedHeaders: configService.get<string>('CORS_ALLOWED_HEADERS') ?? 'Content-Type,Accept,Authorization',
  //   credentials: configService.get<boolean>('CORS_CREDENTIALS') ?? true,
  //   maxAge: Number(configService.get<number>('CORS_MAX_AGE')) ?? 3600,
  // });

  const hardCodedPort: number = 3000;
  const port = Number(configService.get<number>('PORT')) ?? hardCodedPort;

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
