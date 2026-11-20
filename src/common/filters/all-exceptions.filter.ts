import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

/** Unifica el formato de errores y evita exponer detalles en producción. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly config: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        message = payload;
      } else if (payload && typeof payload === 'object') {
        const body = payload as { message?: string | string[]; error?: string };
        message = Array.isArray(body.message)
          ? body.message.join(', ')
          : (body.message ?? message);
        error = body.error ?? error;
      }

      if (statusCode >= 500) {
        this.logger.error(
          `${request.method} ${request.url} ${statusCode}: ${message}`,
          exception.stack,
        );
      } else {
        this.logger.warn(`${request.method} ${request.url} ${statusCode}`);
      }
    } else {
      const details = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(
        `${request.method} ${request.url} ${statusCode}`,
        details,
      );
      if (!isProduction && exception instanceof Error) {
        message = exception.message;
      }
    }

    const body: ErrorResponseBody = {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(body);
  }
}
