import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';

const API_DESCRIPTION = `
## API de gestión de inventario

Documentación interactiva de los módulos **categorías**, **productos**, **movimientos** y **reportes**.

### Módulos

- **categories** — CRUD de categorías y consulta de sus productos.
- **products** — CRUD, búsqueda por nombre/SKU, filtros y paginación.
- **inventory-movements** — entradas, salidas e historial con actualización atómica del stock.
- **inventory** — resumen general, stock bajo y productos sin existencias.

### Formato de listados

Todos los listados devuelven:

    { "data": [], "total": 0, "page": 1, "limit": 10, "totalPages": 0 }

### Errores

    { "statusCode": 404, "message": "Producto no encontrado", "error": "Not Found" }

Prueba cualquier endpoint con el botón **Try it out**.
`;

const SWAGGER_CSS = `
  .swagger-ui .topbar { background-color: #0f172a; }
  .swagger-ui .topbar .download-url-wrapper { display: none; }
  .swagger-ui .info { margin: 2rem 0; }
  .swagger-ui .info .title { color: #0f172a; font-size: 2rem; letter-spacing: -0.02em; }
  .swagger-ui .info .description { color: #475569; }
  .swagger-ui .scheme-container {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    box-shadow: none;
  }
  .swagger-ui .opblock-tag { border-bottom: 1px solid #e2e8f0; }
  .swagger-ui .opblock { border-radius: 8px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06); }
  .swagger-ui .opblock .opblock-summary { padding: 0.8rem 1rem; }
  .swagger-ui .btn.execute { background-color: #2563eb; border-color: #2563eb; color: #fff; }
  .swagger-ui .btn.execute:hover { background-color: #1d4ed8; }
  .swagger-ui .responses-inner h4,
  .swagger-ui .responses-inner h5,
  .swagger-ui .model-title { color: #1e293b; }
  .swagger-ui .parameter__name { font-weight: 600; }
  .swagger-ui .filter-input { border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.5rem 0.75rem; }
`;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useStaticAssets(join(__dirname, '..', 'public'));

  const config = new DocumentBuilder()
    .setTitle('Inventory API')
    .setDescription(API_DESCRIPTION)
    .setVersion('1.0.0')
    .setExternalDoc(
      'Repositorio del proyecto',
      'https://github.com/Andresjl389/testeo-github-nestjs',
    )
    .addServer(`http://localhost:${process.env.PORT ?? 3000}`, 'Servidor local')
    .addTag('categories', 'CRUD de categorías y productos por categoría')
    .addTag('products', 'Catálogo: búsqueda, filtros y paginación')
    .addTag('inventory-movements', 'Entradas, salidas e historial de stock')
    .addTag('inventory', 'Reportes y consultas generales')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Inventory API | Documentación',
    customCss: SWAGGER_CSS,
    swaggerOptions: {
      filter: true,
      deepLinking: true,
      displayRequestDuration: true,
      persistAuthorization: true,
      docExpansion: 'list',
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
