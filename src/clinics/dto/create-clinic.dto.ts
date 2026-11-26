import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateClinicDto {
  @ApiProperty({
    example: 'Clínica Central',
    description: 'Nombre único de la clínica',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({
    example: 'Calle 10 # 20-30',
    description: 'Dirección física de la clínica',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address: string;

  @ApiProperty({
    example: '+57 300 1234567',
    description: 'Teléfono de contacto',
    maxLength: 30,
  })
  @IsString()
  @Matches(/^\+?[0-9\s()-]{7,30}$/, {
    message: 'phone debe tener entre 7 y 30 caracteres válidos',
  })
  phone: string;

  @ApiPropertyOptional({
    example: 'contacto@clinicacentral.com',
    nullable: true,
    maxLength: 120,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @ApiPropertyOptional({
    example: 'Medicina general',
    nullable: true,
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  specialty?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Permite desactivar una clínica sin borrarla',
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
