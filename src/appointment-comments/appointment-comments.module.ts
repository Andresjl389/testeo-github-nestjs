import { Module } from '@nestjs/common';
import { AppointmentCommentsController } from './appointment-comments.controller';
import { AppointmentCommentsService } from './appointment-comments.service';

@Module({
  controllers: [AppointmentCommentsController],
  providers: [AppointmentCommentsService],
  exports: [AppointmentCommentsService],
})
export class AppointmentCommentsModule {}
