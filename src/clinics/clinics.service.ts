import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';

@Injectable()
export class ClinicsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClinicDto) {
    try {
      return await this.prisma.clinic.create({
        data: {
          name: dto.name.trim(),
          address: dto.address.trim(),
          phone: dto.phone.trim(),
          email: dto.email?.trim().toLowerCase() || null,
          specialty: dto.specialty?.trim() || null,
          active: dto.active ?? true,
        },
      });
    } catch (error) {
      this.handlePrismaError(error, 'No se pudo crear la clínica');
    }
  }

  async findAll() {
    return this.prisma.clinic.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const clinic = await this.prisma.clinic.findUnique({ where: { id } });
    if (!clinic) {
      throw new NotFoundException(`Clínica con id ${id} no encontrada`);
    }
    return clinic;
  }

  async update(id: string, dto: UpdateClinicDto) {
    try {
      return await this.prisma.clinic.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.address !== undefined ? { address: dto.address.trim() } : {}),
          ...(dto.phone !== undefined ? { phone: dto.phone.trim() } : {}),
          ...(dto.email !== undefined
            ? { email: dto.email?.trim().toLowerCase() || null }
            : {}),
          ...(dto.specialty !== undefined
            ? { specialty: dto.specialty?.trim() || null }
            : {}),
          ...(dto.active !== undefined ? { active: dto.active } : {}),
        },
      });
    } catch (error) {
      this.handlePrismaError(error, `Clínica con id ${id} no encontrada`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.clinic.delete({ where: { id } });
    } catch (error) {
      this.handlePrismaError(error, `Clínica con id ${id} no encontrada`);
    }
  }

  /** Traduce los errores de Prisma a excepciones HTTP del contrato acordado. */
  private handlePrismaError(error: unknown, notFoundMessage: string): never {
    const code = (error as { code?: string } | null)?.code;

    if (code === 'P2002') {
      throw new ConflictException('Ya existe una clínica con ese nombre');
    }
    if (code === 'P2025') {
      throw new NotFoundException(notFoundMessage);
    }

    throw error;
  }
}
