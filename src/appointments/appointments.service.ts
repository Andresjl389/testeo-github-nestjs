import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

const MS_PER_MINUTE = 60_000;
const MAX_DURATION_MINUTES = 480;

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(clinicId: string, dto: CreateAppointmentDto) {
    await this.ensureClinic(clinicId);
    await this.ensurePatient(clinicId, dto.patientId);

    const scheduledAt = this.parseScheduledAt(dto.scheduledAt);
    const durationMinutes = dto.durationMinutes ?? 30;
    const status = dto.status ?? AppointmentStatus.PENDING;

    if (status !== AppointmentStatus.CANCELLED) {
      await this.ensureNoOverlap(clinicId, scheduledAt, durationMinutes);
    }

    try {
      return await this.prisma.appointment.create({
        data: {
          clinicId,
          patientId: dto.patientId,
          scheduledAt,
          durationMinutes,
          reason: dto.reason.trim(),
          status,
          notes: dto.notes?.trim() || null,
        },
        include: { patient: { select: { id: true, name: true } } },
      });
    } catch (error) {
      this.handlePrismaError(error, 'Cita no encontrada');
    }
  }

  async findAll(clinicId: string, query: QueryAppointmentsDto = {}) {
    await this.ensureClinic(clinicId);

    const where: Prisma.AppointmentWhereInput = { clinicId };
    if (query.status) {
      where.status = query.status;
    }
    if (query.date) {
      const start = new Date(`${query.date}T00:00:00.000Z`);
      where.scheduledAt = {
        gte: start,
        lt: new Date(start.getTime() + 24 * 60 * MS_PER_MINUTE),
      };
    }

    return this.prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: { patient: { select: { id: true, name: true } } },
    });
  }

  async findOne(clinicId: string, appointmentId: string) {
    await this.ensureClinic(clinicId);

    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId },
      include: { patient: { select: { id: true, name: true } } },
    });
    if (!appointment) {
      throw new NotFoundException(
        `Cita con id ${appointmentId} no encontrada en la clínica ${clinicId}`,
      );
    }
    return appointment;
  }

  async update(
    clinicId: string,
    appointmentId: string,
    dto: UpdateAppointmentDto,
  ) {
    await this.ensureClinic(clinicId);
    const existing = await this.findOne(clinicId, appointmentId);

    const patientId = dto.patientId ?? existing.patientId;
    const scheduledAt =
      dto.scheduledAt !== undefined
        ? this.parseScheduledAt(dto.scheduledAt)
        : existing.scheduledAt;
    const durationMinutes = dto.durationMinutes ?? existing.durationMinutes;
    const status = dto.status ?? existing.status;

    await this.ensurePatient(clinicId, patientId);
    if (status !== AppointmentStatus.CANCELLED) {
      await this.ensureNoOverlap(
        clinicId,
        scheduledAt,
        durationMinutes,
        appointmentId,
      );
    }

    try {
      return await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          patientId,
          scheduledAt,
          durationMinutes,
          status,
          ...(dto.reason !== undefined ? { reason: dto.reason.trim() } : {}),
          ...(dto.notes !== undefined
            ? { notes: dto.notes?.trim() || null }
            : {}),
        },
        include: { patient: { select: { id: true, name: true } } },
      });
    } catch (error) {
      this.handlePrismaError(
        error,
        `Cita con id ${appointmentId} no encontrada`,
      );
    }
  }

  async remove(clinicId: string, appointmentId: string): Promise<void> {
    await this.ensureClinic(clinicId);
    await this.findOne(clinicId, appointmentId);

    try {
      await this.prisma.appointment.delete({ where: { id: appointmentId } });
    } catch (error) {
      this.handlePrismaError(
        error,
        `Cita con id ${appointmentId} no encontrada`,
      );
    }
  }

  private parseScheduledAt(value: string): Date {
    const scheduledAt = new Date(value);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException(
        'scheduledAt debe ser una fecha ISO válida',
      );
    }
    if (scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException('La cita debe programarse en el futuro');
    }
    return scheduledAt;
  }

  /** Evita que dos citas activas de la misma clínica se cruzen en el tiempo. */
  private async ensureNoOverlap(
    clinicId: string,
    scheduledAt: Date,
    durationMinutes: number,
    excludeId?: string,
  ): Promise<void> {
    const start = scheduledAt.getTime();
    const end = start + durationMinutes * MS_PER_MINUTE;

    const candidates = await this.prisma.appointment.findMany({
      where: {
        clinicId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        status: { not: AppointmentStatus.CANCELLED },
        scheduledAt: {
          gte: new Date(start - MAX_DURATION_MINUTES * MS_PER_MINUTE),
          lte: new Date(end),
        },
      },
      select: { id: true, scheduledAt: true, durationMinutes: true },
    });

    const conflict = candidates.find((candidate) => {
      const candidateStart = candidate.scheduledAt.getTime();
      const candidateEnd =
        candidateStart + candidate.durationMinutes * MS_PER_MINUTE;
      return candidateStart < end && start < candidateEnd;
    });

    if (conflict) {
      throw new ConflictException(
        'El horario se cruza con otra cita de la clínica',
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

  private async ensurePatient(clinicId: string, patientId: string) {
    const patient = await this.prisma.clinicPatient.findFirst({
      where: { id: patientId, clinicId },
      select: { id: true },
    });
    if (!patient) {
      throw new NotFoundException(
        `Paciente con id ${patientId} no encontrado en la clínica ${clinicId}`,
      );
    }
    return patient;
  }

  private handlePrismaError(error: unknown, notFoundMessage: string): never {
    const code = (error as { code?: string } | null)?.code;

    if (code === 'P2003') {
      throw new BadRequestException('El paciente no pertenece a la clínica');
    }
    if (code === 'P2025') {
      throw new NotFoundException(notFoundMessage);
    }

    throw error;
  }
}
