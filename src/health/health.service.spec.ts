import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  const prismaMock = {
    $queryRaw: jest.fn(),
  };

  const service = new HealthService(prismaMock as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('devuelve ok cuando PostgreSQL responde', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const result = await service.check();

    expect(result.status).toBe('ok');
    expect(result.database).toBe('up');
    expect(result.timestamp).toEqual(expect.any(String));
  });

  it('lanza 503 cuando PostgreSQL no responde', async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(service.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
