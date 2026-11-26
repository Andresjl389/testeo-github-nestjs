import { INestApplication } from '@nestjs/common';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { API_TAGS, buildSwaggerConfig } from '../src/swagger.config';

type HttpMethod = 'get' | 'post' | 'patch' | 'delete' | 'put';

/** Verifica que el documento OpenAPI cubra todos los endpoints implementados. */
describe('Swagger (documentación completa)', () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  const expectedOperations: Record<string, HttpMethod[]> = {
    '/': ['get'],
    '/categories': ['post', 'get'],
    '/categories/{id}': ['get', 'patch', 'delete'],
    '/categories/{id}/products': ['get'],
    '/clinics': ['post', 'get'],
    '/clinics/{id}': ['get', 'patch', 'delete'],
    '/clinics/{clinicId}/items': ['post', 'get'],
    '/clinics/{clinicId}/items/{itemId}': ['get', 'patch', 'delete'],
    '/products': ['post', 'get'],
    '/products/{id}': ['get', 'patch', 'delete'],
    '/inventory-movements': ['post', 'get'],
    '/inventory-movements/{id}': ['get'],
    '/inventory-movements/product/{productId}': ['get'],
    '/inventory/summary': ['get'],
    '/inventory/low-stock': ['get'],
    '/inventory/out-of-stock': ['get'],
    '/health': ['get'],
  };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    document = SwaggerModule.createDocument(app, buildSwaggerConfig());
  });

  afterAll(async () => {
    await app.close();
  });

  it('expone metadatos y los 7 tags del proyecto', () => {
    expect(document.info.title).toBe('Inventory Management API');
    expect(document.info.version).toBe('1.0');
    expect(document.info.description).toContain('data, total, page, limit');
    expect(document.tags?.map((tag) => tag.name)).toEqual(
      API_TAGS.map((tag) => tag.name),
    );
  });

  it('documenta las 17 rutas y las 30 operaciones esperadas', () => {
    expect(Object.keys(document.paths).sort()).toEqual(
      Object.keys(expectedOperations).sort(),
    );

    let operations = 0;
    for (const [path, methods] of Object.entries(expectedOperations)) {
      for (const method of methods) {
        const operation = document.paths[path]?.[method];
        expect(operation).toBeDefined();
        operations += 1;
      }
    }
    expect(operations).toBe(30);
  });

  it('toda operación tiene summary, tags y una respuesta 2xx', () => {
    const failures: string[] = [];
    const methods: HttpMethod[] = ['get', 'post', 'patch', 'delete', 'put'];

    for (const [path, item] of Object.entries(document.paths)) {
      for (const method of methods) {
        const operation = item[method];
        if (!operation) {
          continue;
        }
        const codes = Object.keys(operation.responses ?? {});
        const hasSuccess = codes.some((code) => /^2\d\d$/.test(code));
        if (!operation.summary || !operation.tags?.length || !hasSuccess) {
          failures.push(`${method.toUpperCase()} ${path}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });

  it('documenta esquemas de entidades y parámetros UUID', () => {
    const schemas = Object.keys(document.components?.schemas ?? {});
    for (const schema of [
      'CategoryEntity',
      'ClinicEntity',
      'ClinicInventoryItemEntity',
      'ProductEntity',
      'InventoryMovementEntity',
      'InventorySummaryEntity',
      'HealthEntity',
      'PaginatedProductEntity',
    ]) {
      expect(schemas).toContain(schema);
    }
    expect(schemas).toContain('CreateProductDto');
    expect(schemas).toContain('CreateClinicDto');
    expect(schemas).toContain('CreateClinicItemDto');
    expect(schemas).toContain('CreateInventoryMovementDto');

    const productIdParam = document.paths['/products/{id}']?.get
      ?.parameters?.[0] as { schema?: { format?: string } };
    expect(productIdParam.schema?.format).toBe('uuid');
  });
});
