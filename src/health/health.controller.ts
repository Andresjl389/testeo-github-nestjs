import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthEntity } from './entities/health.entity';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Verificar conectividad con la base de datos',
    description:
      'Ejecuta SELECT 1 contra PostgreSQL. Útil como healthcheck después del despliegue.',
  })
  @ApiOkResponse({ type: HealthEntity })
  @ApiServiceUnavailableResponse({ description: 'Base de datos no disponible' })
  check() {
    return this.healthService.check();
  }
}
