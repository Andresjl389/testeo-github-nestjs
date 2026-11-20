import { toNestLogLevels, validateEnvironment } from './env.validation';

const validConfig = {
  NODE_ENV: 'production',
  DATABASE_URL:
    'postgresql://user:pass@db:5432/inventory_management?sslmode=require',
  PORT: '3000',
  HOST: '0.0.0.0',
  LOG_LEVEL: 'warn',
  SWAGGER_ENABLED: 'true',
};

describe('validateEnvironment', () => {
  it('convierte PORT a número y conserva el resto de variables', () => {
    const result = validateEnvironment(validConfig);

    expect(result.PORT).toBe(3000);
    expect(result.DATABASE_URL).toBe(validConfig.DATABASE_URL);
  });

  it('aplica valores por defecto seguros', () => {
    const result = validateEnvironment({
      DATABASE_URL: validConfig.DATABASE_URL,
    });

    expect(result).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      HOST: '0.0.0.0',
      LOG_LEVEL: 'log',
      SWAGGER_ENABLED: 'true',
    });
  });

  it('rechaza una URL de base de datos inválida', () => {
    expect(() =>
      validateEnvironment({ ...validConfig, DATABASE_URL: 'mysql://db' }),
    ).toThrow('Variables de entorno inválidas');
  });

  it('rechaza un puerto fuera de rango', () => {
    expect(() =>
      validateEnvironment({ ...validConfig, PORT: '70000' }),
    ).toThrow('Variables de entorno inválidas');
  });
});

describe('toNestLogLevels', () => {
  it('asigna los niveles acumulados desde error hasta warn', () => {
    expect(toNestLogLevels('warn')).toEqual(['error', 'warn']);
  });

  it('usa log como nivel seguro cuando el valor es desconocido', () => {
    expect(toNestLogLevels('desconocido')).toEqual(['error', 'warn', 'log']);
  });
});
