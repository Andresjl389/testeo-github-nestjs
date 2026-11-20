import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AllExceptionsFilter } from './../src/common/filters/all-exceptions.filter';
import { PrismaService } from './../src/prisma/prisma.service';

interface HealthResponse {
  status: string;
  database: string;
  timestamp: string;
}

describe('Health (e2e)', () => {
  let app: INestApplication<App>;
  const prismaMock = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter(app.get(ConfigService)));
    await app.init();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  it('/health (GET) devuelve 200 cuando PostgreSQL responde', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      database: 'up',
    });
    const body = response.body as HealthResponse;
    expect(body.timestamp).toEqual(expect.any(String));
  });

  it('/health (GET) devuelve 503 cuando PostgreSQL falla', async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error('ECONNREFUSED'));

    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(503);

    expect(response.body).toMatchObject({
      statusCode: 503,
      message: 'Base de datos no disponible',
      path: '/health',
    });
  });
});
