import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  InventorySummaryEntity,
  PaginatedLowStockProductEntity,
} from './entities/inventory-summary.entity';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Resumen general del inventario',
    description:
      'Agregaciones en base de datos: totales, valor del inventario y top 5 de productos con más movimientos.',
  })
  @ApiOkResponse({ type: InventorySummaryEntity })
  getSummary() {
    return this.inventoryService.getSummary();
  }

  @Get('low-stock')
  @ApiOperation({
    summary: 'Productos con existencias bajas (paginado)',
    description:
      'Productos con 0 < stock <= minStock, ordenados por stock ascendente.',
  })
  @ApiOkResponse({ type: PaginatedLowStockProductEntity })
  @ApiBadRequestResponse({ description: 'Parámetros de paginación inválidos' })
  getLowStock(@Query() query: PaginationQueryDto) {
    return this.inventoryService.getLowStock(query);
  }

  @Get('out-of-stock')
  @ApiOperation({
    summary: 'Productos sin existencias (paginado)',
    description: 'Productos con stock = 0, ordenados por nombre.',
  })
  @ApiOkResponse({ type: PaginatedLowStockProductEntity })
  @ApiBadRequestResponse({ description: 'Parámetros de paginación inválidos' })
  getOutOfStock(@Query() query: PaginationQueryDto) {
    return this.inventoryService.getOutOfStock(query);
  }
}
