import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryProductEntity } from './dto/category-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: {
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
        },
      });
    } catch (error) {
      this.handlePrismaError(error, 'No se pudo crear la categoría');
    }
  }

  async findAll() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Categoría con id ${id} no encontrada`);
    }
    return category;
  }

  async findProducts(id: string): Promise<CategoryProductEntity[]> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { products: { orderBy: { createdAt: 'desc' } } },
    });

    if (!category) {
      throw new NotFoundException(`Categoría con id ${id} no encontrada`);
    }

    return category.products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      stock: product.stock,
      minStock: product.minStock,
      createdAt: product.createdAt,
    }));
  }

  async update(id: string, dto: UpdateCategoryDto) {
    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() || null }
            : {}),
        },
      });
    } catch (error) {
      this.handlePrismaError(error, `Categoría con id ${id} no encontrada`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.category.delete({ where: { id } });
    } catch (error) {
      this.handlePrismaError(error, `Categoría con id ${id} no encontrada`);
    }
  }

  /** Traduce los errores de Prisma a excepciones HTTP del contrato acordado. */
  private handlePrismaError(error: unknown, notFoundMessage: string): never {
    const code = (error as { code?: string } | null)?.code;

    if (code === 'P2002') {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }
    if (code === 'P2003') {
      throw new ConflictException(
        'No se puede eliminar la categoría porque tiene productos asociados',
      );
    }
    if (code === 'P2025') {
      throw new NotFoundException(notFoundMessage);
    }

    throw error;
  }
}
