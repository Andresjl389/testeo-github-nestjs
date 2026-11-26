import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAgendaDto } from './dto/query-agenda.dto';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AgendaService {
  constructor(private readonly prisma: PrismaService) {}

  /** Devuelve las citas de todas las clínicas para un día o un rango. */
  async findAll(query: QueryAgendaDto = {}) {
    const { start, end } = this.resolveRange(query);

    return this.prisma.appointment.findMany({
      where: { scheduledAt: { gte: start, lt: end } },
      orderBy: { scheduledAt: 'asc' },
      include: {
        clinic: { select: { id: true, name: true } },
        patient: { select: { id: true, name: true } },
      },
    });
  }

  private resolveRange(query: QueryAgendaDto): { start: Date; end: Date } {
    if (query.date) {
      const start = this.startOfDay(query.date);
      return { start, end: new Date(start.getTime() + DAY_MS) };
    }

    if (query.start || query.end) {
      if (!query.start || !query.end) {
        throw new BadRequestException('start y end deben enviarse juntos');
      }
      const start = this.startOfDay(query.start);
      const lastDay = this.startOfDay(query.end);
      if (lastDay < start) {
        throw new BadRequestException('end debe ser igual o posterior a start');
      }
      return { start, end: new Date(lastDay.getTime() + DAY_MS) };
    }

    const now = new Date();
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    return { start, end: new Date(start.getTime() + DAY_MS) };
  }

  private startOfDay(value: string): Date {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      throw new BadRequestException(`Fecha no válida: ${value}`);
    }
    return date;
  }
}
