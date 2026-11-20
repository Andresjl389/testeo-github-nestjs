import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovementType } from '../../generated/prisma/client';

export class MovementProductEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  sku: string;
}

export class InventoryMovementEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  productId: string;

  @ApiProperty({ enum: MovementType, enumName: 'MovementType' })
  type: MovementType;

  @ApiProperty({ minimum: 1 })
  quantity: number;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiPropertyOptional({ type: MovementProductEntity })
  product?: MovementProductEntity;
}

/** Formato real de los listados: { data, total, page, limit, totalPages }. */
export class PaginatedInventoryMovementEntity {
  @ApiProperty({ type: [InventoryMovementEntity] })
  data: InventoryMovementEntity[];

  @ApiProperty({ minimum: 0 })
  total: number;

  @ApiProperty({ minimum: 1 })
  page: number;

  @ApiProperty({ minimum: 1 })
  limit: number;

  @ApiProperty({ minimum: 0 })
  totalPages: number;
}
