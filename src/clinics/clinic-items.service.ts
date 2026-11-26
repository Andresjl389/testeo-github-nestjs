import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClinicItemDto } from './dto/create-clinic-item.dto';
import { UpdateClinicItemDto } from './dto/update-clinic-item.dto';

@Injectable()
export class ClinicItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(clinicId: string, dto: CreateClinicItemDto) {
    await this.ensureClinic(clinicId);

    try {
      return await this.prisma.clinicInventoryItem.create({
        data: {
          clinicId,
          name: dto.name.trim(),
          sku: dto.sku?.trim() || null,
          quantity: dto.quantity ?? 0,
          minStock: dto.minStock ?? 0,
          unit: dto.unit?.trim() || null,
          description: dto.description?.trim() || null,
        },
      });
    } catch (error) {
      this.handlePrismaError(error, 'No se pudo crear el insumo');
    }
  }

  async findAll(clinicId: string) {
    await this.ensureClinic(clinicId);
    return this.prisma.clinicInventoryItem.findMany({
      where: { clinicId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(clinicId: string, itemId: string) {
    await this.ensureClinic(clinicId);

    const item = await this.prisma.clinicInventoryItem.findFirst({
      where: { id: itemId, clinicId },
    });
    if (!item) {
      throw new NotFoundException(
        `Insumo con id ${itemId} no encontrado en la clínica ${clinicId}`,
      );
    }
    return item;
  }

  async update(clinicId: string, itemId: string, dto: UpdateClinicItemDto) {
    await this.ensureClinic(clinicId);
    await this.findOne(clinicId, itemId);

    try {
      return await this.prisma.clinicInventoryItem.update({
        where: { id: itemId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.sku !== undefined ? { sku: dto.sku?.trim() || null } : {}),
          ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
          ...(dto.minStock !== undefined ? { minStock: dto.minStock } : {}),
          ...(dto.unit !== undefined ? { unit: dto.unit?.trim() || null } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() || null }
            : {}),
        },
      });
    } catch (error) {
      this.handlePrismaError(error, `Insumo con id ${itemId} no encontrado`);
    }
  }

  async remove(clinicId: string, itemId: string): Promise<void> {
    await this.ensureClinic(clinicId);
    await this.findOne(clinicId, itemId);

    try {
      await this.prisma.clinicInventoryItem.delete({ where: { id: itemId } });
    } catch (error) {
      this.handlePrismaError(error, `Insumo con id ${itemId} no encontrado`);
    }
  }

  private async ensureClinic(clinicId: string): Promise<void> {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { id: true },
    });
    if (!clinic) {
      throw new NotFoundException(`Clínica con id ${clinicId} no encontrada`);
    }
  }

  /** Traduce los errores de Prisma a excepciones HTTP del contrato acordado. */
  private handlePrismaError(error: unknown, notFoundMessage: string): never {
    const code = (error as { code?: string } | null)?.code;

    if (code === 'P2002') {
      throw new ConflictException(
        'Ya existe un insumo con ese nombre en esta clínica',
      );
    }
    if (code === 'P2025') {
      throw new NotFoundException(notFoundMessage);
    }

    throw error;
  }
}
