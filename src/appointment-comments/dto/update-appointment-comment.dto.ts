import { PartialType } from '@nestjs/swagger';
import { CreateAppointmentCommentDto } from './create-appointment-comment.dto';

export class UpdateAppointmentCommentDto extends PartialType(
  CreateAppointmentCommentDto,
) {}
