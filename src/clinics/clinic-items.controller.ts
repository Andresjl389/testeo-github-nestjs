import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ClinicItemsService } from './clinic-items.service';
import { CreateClinicItemDto } from './dto/create-clinic-item.dto';
import { UpdateClinicItemDto } from './dto/update-clinic-item.dto';
import { ClinicInventoryItemEntity } from './entities/clinic-inventory-item.entity';

@ApiTags('clinics')
@Controller('clinics/:clinicId/items')
export class ClinicItemsController {
  constructor(private readonly clinicItemsService: ClinicItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Agregar un insumo al inventario de una clínica' })
  @ApiParam({ name: 'clinicId', format: 'uuid' })
  @ApiCreatedResponse({ type: ClinicInventoryItemEntity })
  @ApiBadRequestResponse({ description: 'Datos inválidos o ids no UUID' })
  @ApiNotFoundResponse({ description: 'Clínica no encontrada' })
  @ApiConflictResponse({
    description: 'Ya existe un insumo con ese nombre en la clínica',
  })
  create(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Body() dto: CreateClinicItemDto,
  ) {
    return this.clinicItemsService.create(clinicId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar el inventario de una clínica' })
  @ApiParam({ name: 'clinicId', format: 'uuid' })
  @ApiOkResponse({ type: ClinicInventoryItemEntity, isArray: true })
  @ApiBadRequestResponse({ description: 'El clinicId no es un UUID válido' })
  @ApiNotFoundResponse({ description: 'Clínica no encontrada' })
  findAll(@Param('clinicId', ParseUUIDPipe) clinicId: string) {
    return this.clinicItemsService.findAll(clinicId);
  }

  @Get(':itemId')
  @ApiOperation({ summary: 'Consultar un insumo de una clínica' })
  @ApiParam({ name: 'clinicId', format: 'uuid' })
  @ApiParam({ name: 'itemId', format: 'uuid' })
  @ApiOkResponse({ type: ClinicInventoryItemEntity })
  @ApiBadRequestResponse({ description: 'Algún id no es un UUID válido' })
  @ApiNotFoundResponse({ description: 'Clínica o insumo no encontrado' })
  findOne(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.clinicItemsService.findOne(clinicId, itemId);
  }

  @Patch(':itemId')
  @ApiOperation({ summary: 'Editar un insumo de una clínica' })
  @ApiParam({ name: 'clinicId', format: 'uuid' })
  @ApiParam({ name: 'itemId', format: 'uuid' })
  @ApiOkResponse({ type: ClinicInventoryItemEntity })
  @ApiBadRequestResponse({ description: 'Datos inválidos o ids no UUID' })
  @ApiNotFoundResponse({ description: 'Clínica o insumo no encontrado' })
  @ApiConflictResponse({
    description: 'Ya existe un insumo con ese nombre en la clínica',
  })
  update(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateClinicItemDto,
  ) {
    return this.clinicItemsService.update(clinicId, itemId, dto);
  }

  @Delete(':itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un insumo de una clínica' })
  @ApiParam({ name: 'clinicId', format: 'uuid' })
  @ApiParam({ name: 'itemId', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Insumo eliminado' })
  @ApiBadRequestResponse({ description: 'Algún id no es un UUID válido' })
  @ApiNotFoundResponse({ description: 'Clínica o insumo no encontrado' })
  remove(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.clinicItemsService.remove(clinicId, itemId);
  }
}
