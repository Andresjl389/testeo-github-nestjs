import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreatePatientDto {
  @ApiProperty({
    example: 'Ana Torres',
    description:
      'Nombre del paciente, único por documento dentro de la clínica',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({
    example: 'CC 1234567890',
    description: 'Documento: no se puede repetir dentro de la misma clínica',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  document?: string;

  @ApiProperty({ example: '+57 300 1234567', maxLength: 30 })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9\s()-]{7,30}$/)
  phone: string;

  @ApiPropertyOptional({ example: 'ana@example.com', maxLength: 120 })
  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @ApiPropertyOptional({ example: '1990-05-20', format: 'date' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({
    example: 'Alergia a penicilina',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
