import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(clinicId: string, dto: CreatePatientDto) {
    await this.ensureClinic(clinicId);

    try {
      return await this.prisma.clinicPatient.create({
        data: {
          clinicId,
          name: dto.name.trim(),
          document: dto.document?.trim() || null,
          phone: dto.phone.trim(),
          email: dto.email?.trim().toLowerCase() || null,
          birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
          notes: dto.notes?.trim() || null,
          active: dto.active ?? true,
        },
      });
    } catch (error) {
      this.handlePrismaError(error, 'Paciente no encontrado');
    }
  }

  async findAll(clinicId: string) {
    await this.ensureClinic(clinicId);
    return this.prisma.clinicPatient.findMany({
      where: { clinicId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(clinicId: string, patientId: string) {
    await this.ensureClinic(clinicId);

    const patient = await this.prisma.clinicPatient.findFirst({
      where: { id: patientId, clinicId },
    });
    if (!patient) {
      throw new NotFoundException(
        `Paciente con id ${patientId} no encontrado en la clínica ${clinicId}`,
      );
    }
    return patient;
  }

  async update(clinicId: string, patientId: string, dto: UpdatePatientDto) {
    await this.ensureClinic(clinicId);
    await this.findOne(clinicId, patientId);

    try {
      return await this.prisma.clinicPatient.update({
        where: { id: patientId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.document !== undefined
            ? { document: dto.document?.trim() || null }
            : {}),
          ...(dto.phone !== undefined ? { phone: dto.phone.trim() } : {}),
          ...(dto.email !== undefined
            ? { email: dto.email?.trim().toLowerCase() || null }
            : {}),
          ...(dto.birthDate !== undefined
            ? { birthDate: dto.birthDate ? new Date(dto.birthDate) : null }
            : {}),
          ...(dto.notes !== undefined
            ? { notes: dto.notes?.trim() || null }
            : {}),
          ...(dto.active !== undefined ? { active: dto.active } : {}),
        },
      });
    } catch (error) {
      this.handlePrismaError(
        error,
        `Paciente con id ${patientId} no encontrado`,
      );
    }
  }

  async remove(clinicId: string, patientId: string): Promise<void> {
    await this.ensureClinic(clinicId);
    await this.findOne(clinicId, patientId);

    try {
      await this.prisma.clinicPatient.delete({ where: { id: patientId } });
    } catch (error) {
      this.handlePrismaError(
        error,
        `Paciente con id ${patientId} no encontrado`,
      );
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

  private handlePrismaError(error: unknown, notFoundMessage: string): never {
    const code = (error as { code?: string } | null)?.code;

    if (code === 'P2002') {
      throw new ConflictException(
        'Ya existe un paciente con ese documento en esta clínica',
      );
    }
    if (code === 'P2025') {
      throw new NotFoundException(notFoundMessage);
    }

    throw error;
  }
}
