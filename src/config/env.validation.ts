import 'reflect-metadata';
import { LogLevel } from '@nestjs/common';
import { plainToInstance, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;
export type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

export const LOG_LEVELS = ['error', 'warn', 'log', 'debug', 'verbose'] as const;
export type LogLevelName = (typeof LOG_LEVELS)[number];

class EnvironmentVariables {
  @IsIn([...NODE_ENVIRONMENTS])
  NODE_ENV: NodeEnvironment;

  @IsString()
  @Matches(/^postgres(ql)?:\/\//i, {
    message: 'DATABASE_URL debe ser una URL de PostgreSQL',
  })
  DATABASE_URL: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number;

  @IsString()
  HOST: string;

  @IsIn([...LOG_LEVELS])
  LOG_LEVEL: LogLevelName;

  @IsIn(['true', 'false'])
  SWAGGER_ENABLED: 'true' | 'false';
}

/**
 * Valida las variables de entorno al arrancar. Nunca incluye los valores en
 * el mensaje de error para no filtrar credenciales en logs.
 */
export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const withDefaults = {
    NODE_ENV: config.NODE_ENV ?? 'development',
    PORT: config.PORT ?? 3000,
    HOST: config.HOST ?? '0.0.0.0',
    LOG_LEVEL: config.LOG_LEVEL ?? 'log',
    SWAGGER_ENABLED: config.SWAGGER_ENABLED ?? 'true',
    DATABASE_URL: config.DATABASE_URL,
  };

  const validated = plainToInstance(EnvironmentVariables, withDefaults, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, {
    skipMissingProperties: false,
    whitelist: true,
  });

  if (errors.length > 0) {
    const messages = errors.flatMap((error) =>
      Object.values(error.constraints ?? {}),
    );
    throw new Error(`Variables de entorno inválidas: ${messages.join('; ')}`);
  }

  return { ...config, ...validated };
}

/** Convierte el nivel configurado a los niveles aceptados por NestJS. */
export function toNestLogLevels(level: string): LogLevel[] {
  const index = LOG_LEVELS.indexOf(level as LogLevelName);
  const safeIndex = index === -1 ? LOG_LEVELS.indexOf('log') : index;
  return [...LOG_LEVELS.slice(0, safeIndex + 1)] as LogLevel[];
}
