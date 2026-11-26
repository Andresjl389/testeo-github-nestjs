import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentEntity } from './entities/appointment.entity';
import { AppointmentsService } from './appointments.service';

@ApiTags('appointments')
@Controller('clinics/:clinicId/appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Programar una cita (valida fecha futura y solapamiento)',
  })
  @ApiParam({ name: 'clinicId', format: 'uuid' })
  @ApiCreatedResponse({ type: AppointmentEntity })
  @ApiBadRequestResponse({
    description: 'Datos inválidos, fecha pasada o clinicId no UUID',
  })
  @ApiNotFoundResponse({ description: 'Clínica o paciente no encontrado' })
  @ApiConflictResponse({ description: 'El horario se cruza con otra cita' })
  create(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(clinicId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar citas por fecha y estado' })
  @ApiParam({ name: 'clinicId', format: 'uuid' })
  @ApiOkResponse({ type: AppointmentEntity, isArray: true })
  @ApiBadRequestResponse({ description: 'El clinicId no es un UUID válido' })
  @ApiNotFoundResponse({ description: 'Clínica no encontrada' })
  findAll(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Query() query: QueryAppointmentsDto,
  ) {
    return this.appointmentsService.findAll(clinicId, query);
  }

  @Get(':appointmentId')
  @ApiOperation({ summary: 'Consultar una cita' })
  @ApiParam({ name: 'clinicId', format: 'uuid' })
  @ApiParam({ name: 'appointmentId', format: 'uuid' })
  @ApiOkResponse({ type: AppointmentEntity })
  @ApiBadRequestResponse({ description: 'Algún id no es un UUID válido' })
  @ApiNotFoundResponse({ description: 'Clínica o cita no encontrada' })
  findOne(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
  ) {
    return this.appointmentsService.findOne(clinicId, appointmentId);
  }

  @Patch(':appointmentId')
  @ApiOperation({ summary: 'Reprogramar o cambiar el estado de una cita' })
  @ApiParam({ name: 'clinicId', format: 'uuid' })
  @ApiParam({ name: 'appointmentId', format: 'uuid' })
  @ApiOkResponse({ type: AppointmentEntity })
  @ApiBadRequestResponse({
    description: 'Datos inválidos, fecha pasada o ids no UUID',
  })
  @ApiNotFoundResponse({
    description: 'Clínica, paciente o cita no encontrado',
  })
  @ApiConflictResponse({ description: 'El horario se cruza con otra cita' })
  update(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(clinicId, appointmentId, dto);
  }

  @Delete(':appointmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una cita y sus comentarios' })
  @ApiParam({ name: 'clinicId', format: 'uuid' })
  @ApiParam({ name: 'appointmentId', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Cita eliminada' })
  @ApiBadRequestResponse({ description: 'Algún id no es un UUID válido' })
  @ApiNotFoundResponse({ description: 'Clínica o cita no encontrada' })
  remove(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
  ) {
    return this.appointmentsService.remove(clinicId, appointmentId);
  }
}
