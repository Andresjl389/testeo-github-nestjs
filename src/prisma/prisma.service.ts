import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../generated/prisma/client';
import { LOG_LEVELS, LogLevelName } from '../config/env.validation';

const PRISMA_LOG_LEVELS: Record<LogLevelName, Prisma.LogLevel[]> = {
  error: ['error'],
  warn: ['error', 'warn'],
  log: ['error', 'warn'],
  debug: ['error', 'warn', 'info', 'query'],
  verbose: ['error', 'warn', 'info', 'query'],
};

function prismaLogLevels(level: string): Prisma.LogLevel[] {
  const known = LOG_LEVELS.includes(level as LogLevelName)
    ? (level as LogLevelName)
    : 'log';
  return PRISMA_LOG_LEVELS[known];
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: config.getOrThrow<string>('DATABASE_URL'),
    });
    super({
      adapter,
      log: prismaLogLevels(config.get<string>('LOG_LEVEL') ?? 'log'),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
