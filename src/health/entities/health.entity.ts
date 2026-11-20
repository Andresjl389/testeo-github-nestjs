import { ApiProperty } from '@nestjs/swagger';

export class HealthEntity {
  @ApiProperty({ example: 'ok', enum: ['ok', 'error'] })
  status: 'ok' | 'error';

  @ApiProperty({ example: 'up', enum: ['up', 'down'] })
  database: 'up' | 'down';

  @ApiProperty({ type: String, format: 'date-time' })
  timestamp: string;
}
