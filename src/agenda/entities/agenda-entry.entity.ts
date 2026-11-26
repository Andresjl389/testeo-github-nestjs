import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '../../generated/prisma/client';

export class AgendaEntryEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: '2026-11-28T09:30:00.000Z' })
  scheduledAt: Date;

  @ApiProperty({ example: 30 })
  durationMinutes: number;

  @ApiProperty({ example: 'Control general' })
  reason: string;

  @ApiProperty({ enum: AppointmentStatus, enumName: 'AppointmentStatus' })
  status: AppointmentStatus;

  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
    },
  })
  clinic: { id: string; name: string };

  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
    },
  })
  patient: { id: string; name: string };
}
