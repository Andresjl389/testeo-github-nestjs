import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  paginate,
  PaginatedResult,
} from '../common/dto/paginated-result.interface';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  InventorySummaryEntity,
  LowStockProductEntity,
  TopProductEntity,
} from './entities/inventory-summary.entity';

interface CountRow {
  count: number;
}

interface ValueRow {
  total: Prisma.Decimal | string | number | null;
}

interface LowStockRow {
  id: string;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
  price: Prisma.Decimal | string | number;
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /** Resumen general calculado con agregaciones de base de datos. */
  async getSummary(): Promise<InventorySummaryEntity> {
    return this.run(async () => {
      const [aggregate, lowStockRows, outOfStockCount, grouped, valueRows] =
        await Promise.all([
          this.prisma.product.aggregate({
            _count: { _all: true },
            _sum: { stock: true },
          }),
          this.prisma.$queryRaw<CountRow[]>(Prisma.sql`
            SELECT COUNT(*)::int AS count
            FROM products
            WHERE stock > 0 AND stock <= min_stock
          `),
          this.prisma.product.count({ where: { stock: 0 } }),
          this.prisma.inventoryMovement.groupBy({
            by: ['productId'],
            _count: { _all: true },
            orderBy: { _count: { productId: 'desc' } },
            take: 5,
          }),
          this.prisma.$queryRaw<ValueRow[]>(Prisma.sql`
            SELECT COALESCE(SUM(stock * price), 0) AS total
            FROM products
          `),
        ]);

      const topIds = grouped.map((item) => item.productId);
      const products = topIds.length
        ? await this.prisma.product.findMany({
            where: { id: { in: topIds } },
            select: { id: true, name: true, sku: true },
          })
        : [];

      const topProducts: TopProductEntity[] = grouped.map((item) => {
        const product = products.find(
          (candidate) => candidate.id === item.productId,
        );
        return {
          productId: item.productId,
          name: product?.name ?? '',
          sku: product?.sku ?? '',
          movementCount: item._count._all,
        };
      });

      return {
        totalProducts: aggregate._count._all,
        totalUnits: aggregate._sum.stock ?? 0,
        lowStockProducts: Number(lowStockRows[0]?.count ?? 0),
        outOfStockProducts: outOfStockCount,
        totalValue: Number(valueRows[0]?.total ?? 0),
        topProducts,
      };
    });
  }

  /** Productos con existencias por encima de cero pero bajo el mínimo. */
  async getLowStock(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<LowStockProductEntity>> {
    return this.run(async () => {
      const skip = (query.page - 1) * query.limit;

      const [rows, countRows] = await Promise.all([
        this.prisma.$queryRaw<LowStockRow[]>(Prisma.sql`
          SELECT id, name, sku, stock, min_stock AS "minStock", price
          FROM products
          WHERE stock > 0 AND stock <= min_stock
          ORDER BY stock ASC, name ASC
          LIMIT ${query.limit} OFFSET ${skip}
        `),
        this.prisma.$queryRaw<CountRow[]>(Prisma.sql`
          SELECT COUNT(*)::int AS count
          FROM products
          WHERE stock > 0 AND stock <= min_stock
        `),
      ]);

      const data = rows.map((row) => ({
        id: row.id,
        name: row.name,
        sku: row.sku,
        stock: row.stock,
        minStock: row.minStock,
        price: Number(row.price),
      }));

      return paginate(
        data,
        Number(countRows[0]?.count ?? 0),
        query.page,
        query.limit,
      );
    });
  }

  async getOutOfStock(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<LowStockProductEntity>> {
    return this.run(async () => {
      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where: { stock: 0 },
          orderBy: { name: 'asc' },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
            minStock: true,
            price: true,
          },
        }),
        this.prisma.product.count({ where: { stock: 0 } }),
      ]);

      const data = products.map((product) => ({
        ...product,
        price: Number(product.price),
      }));

      return paginate(data, total, query.page, query.limit);
    });
  }

  private async run<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Error de base de datos');
    }
  }
}
