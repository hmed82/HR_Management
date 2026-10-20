import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('refuses protected endpoints without a token (GET /users)', () => {
    return request(app.getHttpServer()).get('/users').expect(401);
  });

  it('refuses protected endpoints without a token (GET /employees)', () => {
    return request(app.getHttpServer()).get('/employees').expect(401);
  });

  it('validates the login payload (POST /auth/login)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'not-an-email', password: '123' })
      .expect(400);
  });

  it('rejects unknown credentials (POST /auth/login)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'wrong-password' })
      .expect(401);
  });

  it('accepts invalid refresh tokens with 401 (POST /auth/refresh)', () => {
    return request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refresh_token: 'not-a-token' })
      .expect(401);
  });
});
