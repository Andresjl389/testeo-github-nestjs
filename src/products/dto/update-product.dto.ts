import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

/**
 * El stock NO se expone aquí: los cambios de existencias solo ocurren
 * mediante movimientos de inventario (contrato de la sección 18).
 */
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['stock'] as const),
) {}
