import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  MovementType,
  Prisma,
  type InventoryMovement,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginatedResult } from '../common/dto/paginated-result.interface';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { QueryInventoryMovementsDto } from './dto/query-inventory-movements.dto';

const PRODUCT_PREVIEW = {
  id: true,
  name: true,
  sku: true,
} as const;

@Injectable()
export class InventoryMovementsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra un movimiento y actualiza el stock en una única transacción.
   * La salida usa un updateMany condicional para que dos salidas concurrentes
   * no puedan dejar el stock por debajo de cero.
   */
  async create(dto: CreateInventoryMovementDto): Promise<InventoryMovement> {
    return this.run(() =>
      this.prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: { id: dto.productId },
          select: { id: true, stock: true },
        });

        if (!product) {
          throw new NotFoundException(
            `Producto con id ${dto.productId} no encontrado`,
          );
        }

        if (dto.type === MovementType.OUT) {
          const updated = await tx.product.updateMany({
            where: { id: dto.productId, stock: { gte: dto.quantity } },
            data: { stock: { decrement: dto.quantity } },
          });

          if (updated.count === 0) {
            const current = await tx.product.findUnique({
              where: { id: dto.productId },
              select: { id: true },
            });
            if (!current) {
              throw new NotFoundException(
                `Producto con id ${dto.productId} no encontrado`,
              );
            }
            throw new ConflictException(
              `Stock insuficiente para el producto ${dto.productId}`,
            );
          }
        } else {
          await tx.product.update({
            where: { id: dto.productId },
            data: { stock: { increment: dto.quantity } },
          });
        }

        return tx.inventoryMovement.create({
          data: {
            productId: dto.productId,
            type: dto.type,
            quantity: dto.quantity,
            description: dto.description,
          },
        });
      }),
    );
  }

  async findAll(
    query: QueryInventoryMovementsDto,
  ): Promise<PaginatedResult<InventoryMovement>> {
    return this.run(async () => {
      const where = this.buildWhere(query);
      const skip = (query.page - 1) * query.limit;

      const [data, total] = await Promise.all([
        this.prisma.inventoryMovement.findMany({
          where,
          include: { product: { select: PRODUCT_PREVIEW } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: query.limit,
        }),
        this.prisma.inventoryMovement.count({ where }),
      ]);

      return paginate(data, total, query.page, query.limit);
    });
  }

  async findOne(id: string): Promise<InventoryMovement> {
    return this.run(async () => {
      const movement = await this.prisma.inventoryMovement.findUnique({
        where: { id },
        include: { product: { select: PRODUCT_PREVIEW } },
      });
      if (!movement) {
        throw new NotFoundException(
          `Movimiento con id ${id} no encontrado`,
        );
      }
      return movement;
    });
  }

  /** Historial completo (paginado) de los movimientos de un producto. */
  async findByProduct(
    productId: string,
    query: QueryInventoryMovementsDto,
  ): Promise<PaginatedResult<InventoryMovement>> {
    return this.run(async () => {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
      });
      if (!product) {
        throw new NotFoundException(
          `Producto con id ${productId} no encontrado`,
        );
      }

      const where: Prisma.InventoryMovementWhereInput = {
        productId,
        ...(query.type ? { type: query.type } : {}),
        ...(query.startDate || query.endDate
          ? {
              createdAt: {
                ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
                ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
              },
            }
          : {}),
      };
      const skip = (query.page - 1) * query.limit;

      const [data, total] = await Promise.all([
        this.prisma.inventoryMovement.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: query.limit,
        }),
        this.prisma.inventoryMovement.count({ where }),
      ]);

      return paginate(data, total, query.page, query.limit);
    });
  }

  private buildWhere(
    query: QueryInventoryMovementsDto,
  ): Prisma.InventoryMovementWhereInput {
    return {
      ...(query.type ? { type: query.type } : {}),
      ...(query.productId ? { productId: query.productId } : {}),
      ...(query.startDate || query.endDate
        ? {
            createdAt: {
              ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
            },
          }
        : {}),
    };
  }

  /** Traduce errores de Prisma a códigos HTTP del contrato común. */
  private async run<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Recurso no encontrado');
      }
      throw new InternalServerErrorException('Error de base de datos');
    }
  }
}
