import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductCategoryEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Teclados' })
  name: string;
}

export class ProductEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Teclado mecánico' })
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({ example: 'TEC-001' })
  sku: string;

  @ApiProperty({ type: String, example: '49.90', description: 'Decimal serializado como texto' })
  price: string;

  @ApiProperty({ example: 25 })
  stock: number;

  @ApiProperty({ example: 5 })
  minStock: number;

  @ApiProperty({ format: 'uuid' })
  categoryId: string;

  @ApiPropertyOptional({ type: ProductCategoryEntity })
  category?: ProductCategoryEntity;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

/** Formato real de los listados: { data, total, page, limit, totalPages }. */
export class PaginatedProductEntity {
  @ApiProperty({ type: [ProductEntity] })
  data: ProductEntity[];

  @ApiProperty({ minimum: 0 })
  total: number;

  @ApiProperty({ minimum: 1 })
  page: number;

  @ApiProperty({ minimum: 1 })
  limit: number;

  @ApiProperty({ minimum: 0 })
  totalPages: number;
}
