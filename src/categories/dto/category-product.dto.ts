import { ApiProperty } from '@nestjs/swagger';

/** Producto devuelto por GET /categories/:id/products. */
export class CategoryProductEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Teclado mecánico' })
  name: string;

  @ApiProperty({ example: 'TEC-001' })
  sku: string;

  @ApiProperty({
    type: String,
    example: '49.90',
    description: 'Decimal serializado como texto',
  })
  price: string;

  @ApiProperty({ example: 25 })
  stock: number;

  @ApiProperty({ example: 5 })
  minStock: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}
