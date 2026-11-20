import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

/** Tags usados por los controladores; servirán también como agrupación visual. */
export const API_TAGS = [
  {
    name: 'app',
    description: 'Endpoint raíz / verificación rápida del servicio',
  },
  {
    name: 'categories',
    description: 'CRUD de categorías y consulta de sus productos',
  },
  {
    name: 'products',
    description:
      'CRUD de productos, búsqueda, filtros y paginación. El stock no se edita aquí: se modifica con movimientos.',
  },
  {
    name: 'inventory-movements',
    description:
      'Entradas (IN) y salidas (OUT) atómicas, historial paginado y filtros',
  },
  {
    name: 'inventory',
    description: 'Reportes agregados: resumen, stock bajo y sin existencias',
  },
  {
    name: 'health',
    description: 'Healthcheck de conectividad con PostgreSQL',
  },
] as const;

/** Configuración compartida por bootstrap() y por la prueba de Swagger. */
export function buildSwaggerConfig(): Omit<OpenAPIObject, 'paths'> {
  const builder = new DocumentBuilder()
    .setTitle('Inventory Management API')
    .setDescription(
      'API de gestión de inventario: categorías, productos, movimientos atómicos y reportes. ' +
        'Todas las respuestas paginadas usan `{ data, total, page, limit, totalPages }`. ' +
        'Los errores siguen el formato `{ statusCode, message, error, timestamp, path }`.',
    )
    .setVersion('1.0')
    .addServer('/', 'Servidor actual');

  for (const tag of API_TAGS) {
    builder.addTag(tag.name, tag.description);
  }

  return builder.build();
}
