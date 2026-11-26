import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '../../generated/prisma/client';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export class QueryAppointmentsDto {
  @ApiPropertyOptional({
    enum: AppointmentStatus,
    enumName: 'AppointmentStatus',
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({
    example: '2026-12-01',
    description: 'Filtra las citas de un día (YYYY-MM-DD, UTC)',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
