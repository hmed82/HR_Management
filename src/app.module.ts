import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import * as Joi from 'joi';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DB_TYPE: Joi.string().valid('mysql', 'postgres', 'mariadb').required(),
        DB_HOST: Joi.string().default('localhost'),
        DB_PORT: Joi.number().default(3306),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        DB_SYNCHRONIZE: Joi.boolean().default(false),
        PORT: Joi.number().default(3000),
        CORS_ORIGIN: Joi.string().default('*'),
        CORS_METHODS: Joi.string().default('GET,HEAD,PUT,PATCH,POST,DELETE'),
        CORS_ALLOWED_HEADERS: Joi.string().default('Content-Type,Accept'),
        CORS_CREDENTIALS: Joi.boolean().default(true),
        CORS_MAX_AGE: Joi.number().default(3600),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().default('3600'),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default('604800'),
        BCRYPT_SALT_ROUNDS: Joi.number().min(4).max(31).default(10),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>('DB_TYPE') as any, // Adjust 'as any' if you know the specific DB type (e.g., 'mysql')
        host: configService.get<string>('DB_HOST') ?? 'localhost',
        port: Number(configService.get<number>('DB_PORT') ?? 3306),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE') ?? false, // Default to false for safety
      }),
      inject: [ConfigService],
    }),
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
