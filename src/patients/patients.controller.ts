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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientEntity } from './entities/patient.entity';
import { PatientsService } from './patients.service';

@ApiTags('patients')
@Controller('clinics/:clinicId/patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un paciente en una clínica' })
  @ApiParam({ name: 'clinicId', format: 'uuid' })
  @ApiCreatedResponse({ type: PatientEntity })
  @ApiBadRequestResponse({ description: 'Datos inválidos o clinicId no UUID' })
  @ApiNotFoundResponse({ description: 'Clínica no encontrada' })
  @ApiConflictResponse({ description: 'Documento repetido en la clínica' })
  create(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Body() dto: CreatePatientDto,
  ) {
    return this.patientsService.create(clinicId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar los pacientes de una clínica' })
  @ApiParam({ name: 'clinicId', format: 'uuid' })
  @ApiOkResponse({ type: PatientEntity, isArray: true })
  @ApiBadRequestResponse({ description: 'El clinicId no es un UUID válido' })
  @ApiNotFoundResponse({ description: 'Clínica no encontrada' })
  findAll(@Param('clinicId', ParseUUIDPipe) clinicId: string) {
    return this.patientsService.findAll(clinicId);
  }

  @Get(':patientId')
  @ApiOperation({ summary: 'Consultar un paciente de una clínica' })
  @ApiParam({ name: 'clinicId', format: 'uuid' })
  @ApiParam({ name: 'patientId', format: 'uuid' })
  @ApiOkResponse({ type: PatientEntity })
  @ApiBadRequestResponse({ description: 'Algún id no es un UUID válido' })
  @ApiNotFoundResponse({ description: 'Clínica o paciente no encontrado' })
  findOne(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ) {
    return this.patientsService.findOne(clinicId, patientId);
  }

  @Patch(':patientId')
  @ApiOperation({ summary: 'Editar un paciente de una clínica' })
  @ApiParam({ name: 'clinicId', format: 'uuid' })
  @ApiParam({ name: 'patientId', format: 'uuid' })
  @ApiOkResponse({ type: PatientEntity })
  @ApiBadRequestResponse({ description: 'Datos inválidos o ids no UUID' })
  @ApiNotFoundResponse({ description: 'Clínica o paciente no encontrado' })
  @ApiConflictResponse({ description: 'Documento repetido en la clínica' })
  update(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patientsService.update(clinicId, patientId, dto);
  }

  @Delete(':patientId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un paciente y sus citas' })
  @ApiParam({ name: 'clinicId', format: 'uuid' })
  @ApiParam({ name: 'patientId', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Paciente eliminado' })
  @ApiBadRequestResponse({ description: 'Algún id no es un UUID válido' })
  @ApiNotFoundResponse({ description: 'Clínica o paciente no encontrado' })
  remove(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ) {
    return this.patientsService.remove(clinicId, patientId);
  }
}
