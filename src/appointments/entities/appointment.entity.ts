import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '../../generated/prisma/client';

export class AppointmentEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  clinicId: string;

  @ApiProperty({ format: 'uuid' })
  patientId: string;

  @ApiPropertyOptional({
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
    },
  })
  patient?: { id: string; name: string };

  @ApiProperty({ example: '2026-12-01T09:30:00.000Z' })
  scheduledAt: Date;

  @ApiProperty({ example: 30 })
  durationMinutes: number;

  @ApiProperty({ example: 'Control general' })
  reason: string;

  @ApiProperty({ enum: AppointmentStatus, enumName: 'AppointmentStatus' })
  status: AppointmentStatus;

  @ApiPropertyOptional({ type: String, nullable: true })
  notes: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
