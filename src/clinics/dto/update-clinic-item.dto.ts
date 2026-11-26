import { PartialType } from '@nestjs/swagger';
import { CreateClinicItemDto } from './create-clinic-item.dto';

export class UpdateClinicItemDto extends PartialType(CreateClinicItemDto) {}
