import { ApiProperty } from '@nestjs/swagger';

export class TopProductEntity {
  @ApiProperty({ format: 'uuid' })
  productId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  sku: string;

  @ApiProperty({ description: 'Cantidad de movimientos registrados' })
  movementCount: number;
}

export class InventorySummaryEntity {
  @ApiProperty({ description: 'Cantidad total de productos registrados' })
  totalProducts: number;

  @ApiProperty({ description: 'Total de unidades disponibles' })
  totalUnits: number;

  @ApiProperty({ description: 'Productos con 0 < stock <= minStock' })
  lowStockProducts: number;

  @ApiProperty({ description: 'Productos con stock = 0' })
  outOfStockProducts: number;

  @ApiProperty({ description: 'Suma de price * stock de todos los productos' })
  totalValue: number;

  @ApiProperty({ type: TopProductEntity, isArray: true })
  topProducts: TopProductEntity[];
}

export class LowStockProductEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  stock: number;

  @ApiProperty({ description: 'Stock mínimo configurado' })
  minStock: number;

  @ApiProperty()
  price: number;
}
