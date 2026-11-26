import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AgendaService } from './agenda.service';
import { QueryAgendaDto } from './dto/query-agenda.dto';
import { AgendaEntryEntity } from './entities/agenda-entry.entity';

@ApiTags('agenda')
@Controller('agenda')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Get()
  @ApiOperation({
    summary:
      'Agenda del día o de un rango, con el nombre de la clínica y del paciente',
  })
  @ApiOkResponse({ type: AgendaEntryEntity, isArray: true })
  @ApiBadRequestResponse({ description: 'Fechas inválidas o rango invertido' })
  @ApiQuery({
    name: 'date',
    required: false,
    format: 'date',
    example: '2026-11-26',
    description: 'Un día concreto (YYYY-MM-DD, UTC)',
  })
  @ApiQuery({
    name: 'start',
    required: false,
    format: 'date',
    example: '2026-11-01',
    description: 'Inicio del rango (YYYY-MM-DD, UTC)',
  })
  @ApiQuery({
    name: 'end',
    required: false,
    format: 'date',
    example: '2026-11-30',
    description: 'Fin del rango inclusive (YYYY-MM-DD, UTC)',
  })
  findAll(@Query() query: QueryAgendaDto) {
    return this.agendaService.findAll(query);
  }
}
