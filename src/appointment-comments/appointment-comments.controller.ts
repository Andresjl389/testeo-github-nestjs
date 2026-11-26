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
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AppointmentCommentsService } from './appointment-comments.service';
import { CreateAppointmentCommentDto } from './dto/create-appointment-comment.dto';
import { UpdateAppointmentCommentDto } from './dto/update-appointment-comment.dto';
import { AppointmentCommentEntity } from './entities/appointment-comment.entity';

@ApiTags('comments')
@Controller('clinics/:clinicId/appointments/:appointmentId/comments')
export class AppointmentCommentsController {
  constructor(
    private readonly appointmentCommentsService: AppointmentCommentsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Agregar un comentario al historial de una cita' })
  @ApiParam({ name: 'clinicId', format: 'uuid' })
  @ApiParam({ name: 'appointmentId', format: 'uuid' })
  @ApiCreatedResponse({ type: AppointmentCommentEntity })
  @ApiBadRequestResponse({ description: 'Datos inválidos o ids no UUID' })
  @ApiNotFoundResponse({ description: 'Clínica o cita no encontrada' })
  create(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @Body() dto: CreateAppointmentCommentDto,
  ) {
    return this.appointmentCommentsService.create(clinicId, appointmentId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar el historial de comentarios de una cita' })
  @ApiParam({ name: 'clinicId', format: 'uuid' })
  @ApiParam({ name: 'appointmentId', format: 'uuid' })
  @ApiOkResponse({ type: AppointmentCommentEntity, isArray: true })
  @ApiBadRequestResponse({ description: 'Algún id no es un UUID válido' })
  @ApiNotFoundResponse({ description: 'Clínica o cita no encontrada' })
  findAll(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
  ) {
    return this.appointmentCommentsService.findAll(clinicId, appointmentId);
  }

  @Get(':commentId')
  @ApiOperation({ summary: 'Consultar un comentario de una cita' })
  @ApiParam({ name: 'clinicId', format: 'uuid' })
  @ApiParam({ name: 'appointmentId', format: 'uuid' })
  @ApiParam({ name: 'commentId', format: 'uuid' })
  @ApiOkResponse({ type: AppointmentCommentEntity })
  @ApiBadRequestResponse({ description: 'Algún id no es un UUID válido' })
  @ApiNotFoundResponse({ description: 'Cita o comentario no encontrado' })
  findOne(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ) {
    return this.appointmentCommentsService.findOne(
      clinicId,
      appointmentId,
      commentId,
    );
  }

  @Patch(':commentId')
  @ApiOperation({ summary: 'Editar un comentario' })
  @ApiParam({ name: 'clinicId', format: 'uuid' })
  @ApiParam({ name: 'appointmentId', format: 'uuid' })
  @ApiParam({ name: 'commentId', format: 'uuid' })
  @ApiOkResponse({ type: AppointmentCommentEntity })
  @ApiBadRequestResponse({ description: 'Datos inválidos o ids no UUID' })
  @ApiNotFoundResponse({ description: 'Cita o comentario no encontrado' })
  update(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: UpdateAppointmentCommentDto,
  ) {
    return this.appointmentCommentsService.update(
      clinicId,
      appointmentId,
      commentId,
      dto,
    );
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un comentario del historial' })
  @ApiParam({ name: 'clinicId', format: 'uuid' })
  @ApiParam({ name: 'appointmentId', format: 'uuid' })
  @ApiParam({ name: 'commentId', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Comentario eliminado' })
  @ApiBadRequestResponse({ description: 'Algún id no es un UUID válido' })
  @ApiNotFoundResponse({ description: 'Cita o comentario no encontrado' })
  remove(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ) {
    return this.appointmentCommentsService.remove(
      clinicId,
      appointmentId,
      commentId,
    );
  }
}
