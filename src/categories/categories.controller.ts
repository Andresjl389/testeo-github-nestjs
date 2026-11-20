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
import { CategoriesService } from './categories.service';
import { CategoryProductEntity } from './dto/category-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryEntity } from './entities/category.entity';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear categoría' })
  @ApiCreatedResponse({ type: CategoryEntity })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiConflictResponse({
    description: 'Ya existe una categoría con ese nombre',
  })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las categorías' })
  @ApiOkResponse({ type: CategoryEntity, isArray: true })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Consultar los productos de una categoría' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: CategoryProductEntity, isArray: true })
  @ApiBadRequestResponse({ description: 'El id no es un UUID válido' })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  findProducts(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findProducts(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar una categoría por su id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: CategoryEntity })
  @ApiBadRequestResponse({ description: 'El id no es un UUID válido' })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una categoría' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: CategoryEntity })
  @ApiBadRequestResponse({ description: 'Datos inválidos o id no UUID' })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  @ApiConflictResponse({
    description: 'Ya existe una categoría con ese nombre',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una categoría' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Categoría eliminada' })
  @ApiBadRequestResponse({ description: 'El id no es un UUID válido' })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  @ApiConflictResponse({
    description: 'La categoría tiene productos asociados',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(id);
  }
}
