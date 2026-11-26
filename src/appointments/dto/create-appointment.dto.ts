import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '../../generated/prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Paciente registrado en la clínica',
  })
  @IsUUID()
  patientId: string;

  @ApiProperty({
    example: '2026-12-01T09:30:00.000Z',
    description: 'Fecha y hora de la cita en formato ISO 8601',
  })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({ example: 30, minimum: 5, maximum: 480 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes?: number;

  @ApiProperty({ example: 'Control general', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  reason: string;

  @ApiPropertyOptional({
    enum: AppointmentStatus,
    enumName: 'AppointmentStatus',
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({
    example: 'Llegar 10 minutos antes',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
