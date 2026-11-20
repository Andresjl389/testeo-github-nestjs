import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  InventorySummaryEntity,
  LowStockProductEntity,
} from './entities/inventory-summary.entity';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumen general del inventario' })
  @ApiOkResponse({ type: InventorySummaryEntity })
  getSummary() {
    return this.inventoryService.getSummary();
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Productos con existencias bajas (paginado)' })
  @ApiOkResponse({ type: LowStockProductEntity, isArray: true })
  getLowStock(@Query() query: PaginationQueryDto) {
    return this.inventoryService.getLowStock(query);
  }

  @Get('out-of-stock')
  @ApiOperation({ summary: 'Productos sin existencias (paginado)' })
  @ApiOkResponse({ type: LowStockProductEntity, isArray: true })
  getOutOfStock(@Query() query: PaginationQueryDto) {
    return this.inventoryService.getOutOfStock(query);
  }
}
