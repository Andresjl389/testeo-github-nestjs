import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  InventoryMovementEntity,
  PaginatedInventoryMovementEntity,
} from './entities/inventory-movement.entity';
import { InventoryMovementsService } from './inventory-movements.service';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { QueryInventoryMovementsDto } from './dto/query-inventory-movements.dto';

@ApiTags('inventory-movements')
@Controller('inventory-movements')
export class InventoryMovementsController {
  constructor(
    private readonly inventoryMovementsService: InventoryMovementsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una entrada o salida de inventario' })
  @ApiCreatedResponse({ type: InventoryMovementEntity })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  @ApiConflictResponse({ description: 'Stock insuficiente para una salida' })
  create(@Body() dto: CreateInventoryMovementDto) {
    return this.inventoryMovementsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar movimientos (filtros: type, productId, startDate, endDate)',
  })
  @ApiOkResponse({ type: PaginatedInventoryMovementEntity })
  @ApiBadRequestResponse({ description: 'Parámetros de consulta inválidos' })
  findAll(@Query() query: QueryInventoryMovementsDto) {
    return this.inventoryMovementsService.findAll(query);
  }

  @Get('product/:productId')
  @ApiOperation({
    summary:
      'Historial paginado de movimientos de un producto (admite los mismos filtros)',
  })
  @ApiParam({ name: 'productId', format: 'uuid' })
  @ApiOkResponse({ type: PaginatedInventoryMovementEntity })
  @ApiBadRequestResponse({ description: 'El id no es un UUID válido' })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  findByProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() query: QueryInventoryMovementsDto,
  ) {
    return this.inventoryMovementsService.findByProduct(productId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un movimiento por su id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: InventoryMovementEntity })
  @ApiBadRequestResponse({ description: 'El id no es un UUID válido' })
  @ApiNotFoundResponse({ description: 'Movimiento no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryMovementsService.findOne(id);
  }
}
