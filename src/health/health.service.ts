import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HealthEntity } from './entities/health.entity';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthEntity> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'up',
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error(
        'La verificación de conectividad con PostgreSQL falló',
        error instanceof Error ? error.stack : String(error),
      );
      throw new ServiceUnavailableException({
        statusCode: 503,
        message: 'Base de datos no disponible',
        error: 'Service Unavailable',
        timestamp: new Date().toISOString(),
        path: '/health',
      });
    }
  }
}
