import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

/** Tags usados por los controladores; servirán también como agrupación visual. */
export const API_TAGS = [
  {
    name: 'app',
    description: 'Endpoint raíz / verificación rápida del servicio',
  },
  {
    name: 'agenda',
    description:
      'Agenda del día o de un rango para el calendario de salud; incluye clínica y paciente.',
  },
  {
    name: 'categories',
    description: 'CRUD de categorías y consulta de sus productos',
  },
  {
    name: 'clinics',
    description:
      'CRUD de práctica de clínicas, su inventario, pacientes y citas. Formulario en /clinicas.html',
  },
  {
    name: 'patients',
    description:
      'Pacientes registrados por clínica; el documento es único dentro de cada una.',
  },
  {
    name: 'appointments',
    description:
      'Citas con fecha, hora, duración y estado; validan fecha futura y solapamiento.',
  },
  {
    name: 'comments',
    description: 'Historial de comentarios y seguimiento de cada cita.',
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
