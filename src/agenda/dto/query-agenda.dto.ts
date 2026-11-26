import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class QueryAgendaDto {
  @ApiPropertyOptional({
    example: '2026-11-26',
    format: 'date',
    description: 'Un día concreto (YYYY-MM-DD, UTC)',
  })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'date debe tener formato YYYY-MM-DD' })
  date?: string;

  @ApiPropertyOptional({
    example: '2026-11-01',
    format: 'date',
    description: 'Inicio del rango (YYYY-MM-DD, UTC)',
  })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'start debe tener formato YYYY-MM-DD' })
  start?: string;

  @ApiPropertyOptional({
    example: '2026-11-30',
    format: 'date',
    description: 'Fin del rango, inclusive (YYYY-MM-DD, UTC)',
  })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'end debe tener formato YYYY-MM-DD' })
  end?: string;
}
