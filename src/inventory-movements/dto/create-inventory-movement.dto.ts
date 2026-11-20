import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  IsEnum,
} from 'class-validator';
import { MovementType } from '../../generated/prisma/client';

export class CreateInventoryMovementDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Producto al que pertenece el movimiento',
  })
  @IsUUID('4')
  productId: string;

  @ApiProperty({
    enum: MovementType,
    enumName: 'MovementType',
    description: 'IN = entrada, OUT = salida',
  })
  @IsEnum(MovementType)
  type: MovementType;

  @ApiProperty({ minimum: 1, description: 'Cantidad de unidades' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    maxLength: 255,
    description: 'Motivo del movimiento',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
