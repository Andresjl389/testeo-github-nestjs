import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MovementType, Prisma } from '../generated/prisma/client';
import {
  paginate,
  PaginatedResult,
} from '../common/dto/paginated-result.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductEntity } from './entities/product.entity';

const CATEGORY_PREVIEW = { id: true, name: true } as const;

type ProductWithCategory = Prisma.ProductGetPayload<{
  include: { category: { select: typeof CATEGORY_PREVIEW } };
}>;

interface ErrorMessages {
  notFound: string;
  duplicate: string;
  fkMessage: string;
  /** 404 cuando la FK falla al crear/actualizar; 409 al eliminar con movimientos. */
  fkStatus?: 404 | 409;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto): Promise<ProductEntity> {
    try {
      const product = await this.prisma.product.create({
        data: {
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          sku: dto.sku.trim(),
          price: new Prisma.Decimal(dto.price),
          stock: dto.stock ?? 0,
          minStock: dto.minStock ?? 0,
          categoryId: dto.categoryId,
        },
        include: { category: { select: CATEGORY_PREVIEW } },
      });
      return this.toEntity(product);
    } catch (error) {
      this.handlePrismaError(error, {
        notFound: 'La categoría indicada no existe',
        duplicate: 'Ya existe un producto con ese SKU',
        fkMessage: 'La categoría indicada no existe',
        fkStatus: 404,
      });
    }
  }

  async findAll(
    query: QueryProductsDto,
  ): Promise<PaginatedResult<ProductEntity>> {
    const where: Prisma.ProductWhereInput = {
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { sku: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      // Comparación entre columnas: stock <= min_stock (field reference).
      ...(query.lowStock
        ? { stock: { lte: this.prisma.product.fields.minStock } }
        : {}),
    };
    const skip = (query.page - 1) * query.limit;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: { select: CATEGORY_PREVIEW } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return paginate(
      products.map((product) => this.toEntity(product)),
      total,
      query.page,
      query.limit,
    );
  }

  async findOne(id: string): Promise<ProductEntity> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: { select: CATEGORY_PREVIEW } },
    });
    if (!product) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    return this.toEntity(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductEntity> {
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() || null }
            : {}),
          ...(dto.sku !== undefined ? { sku: dto.sku.trim() } : {}),
          ...(dto.price !== undefined
            ? { price: new Prisma.Decimal(dto.price) }
            : {}),
          ...(dto.minStock !== undefined ? { minStock: dto.minStock } : {}),
          ...(dto.categoryId !== undefined
            ? { categoryId: dto.categoryId }
            : {}),
          // stock NO se actualiza aquí; solo vía movimientos.
        },
        include: { category: { select: CATEGORY_PREVIEW } },
      });
      return this.toEntity(product);
    } catch (error) {
      this.handlePrismaError(error, {
        notFound: `Producto con id ${id} no encontrado`,
        duplicate: 'Ya existe un producto con ese SKU',
        fkMessage: 'La categoría indicada no existe',
        fkStatus: 404,
      });
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.product.delete({ where: { id } });
    } catch (error) {
      this.handlePrismaError(error, {
        notFound: `Producto con id ${id} no encontrado`,
        duplicate: 'Ya existe un producto con ese SKU',
        fkMessage:
          'No se puede eliminar el producto porque tiene movimientos asociados',
      });
    }
  }

  /**
   * Contrato con InventoryMovementsModule (sección 18).
   * Debe ejecutarse dentro de prisma.$transaction para mantener la atomicidad.
   */
  async applyMovement(
    productId: string,
    movement: { type: MovementType; quantity: number },
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException(`Producto con id ${productId} no encontrado`);
    }

    if (movement.type === MovementType.OUT) {
      const updated = await tx.product.updateMany({
        where: { id: productId, stock: { gte: movement.quantity } },
        data: { stock: { decrement: movement.quantity } },
      });
      if (updated.count === 0) {
        throw new ConflictException(
          `Stock insuficiente para el producto ${productId}`,
        );
      }
      return;
    }

    await tx.product.update({
      where: { id: productId },
      data: { stock: { increment: movement.quantity } },
    });
  }

  /** Validación de lectura; acepta el cliente de transacción si ya hay una. */
  async exists(
    productId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    const client = tx ?? this.prisma;
    const count = await client.product.count({ where: { id: productId } });
    return count > 0;
  }

  private toEntity(product: ProductWithCategory): ProductEntity {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
      price: product.price.toString(),
      stock: product.stock,
      minStock: product.minStock,
      categoryId: product.categoryId,
      category: product.category,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private handlePrismaError(error: unknown, messages: ErrorMessages): never {
    const code = (error as { code?: string } | null)?.code;

    if (code === 'P2002') {
      throw new ConflictException(messages.duplicate);
    }
    if (code === 'P2003') {
      if (messages.fkStatus === 404) {
        throw new NotFoundException(messages.fkMessage);
      }
      throw new ConflictException(messages.fkMessage);
    }
    if (code === 'P2025') {
      throw new NotFoundException(messages.notFound);
    }
    if (code === 'P2010') {
      throw new ConflictException(
        'Violación de una restricción de la base de datos',
      );
    }

    throw error;
  }
}
