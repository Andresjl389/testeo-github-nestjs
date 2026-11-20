const baseUrl = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const checks = [
  {
    name: 'GET /health',
    path: '/health',
    validate: (body) => body.status === 'ok' && body.database === 'up',
  },
  {
    name: 'GET /api/docs',
    path: '/api/docs',
    expectJson: false,
    validate: (body) => body.includes('Swagger UI'),
  },
  {
    name: 'GET /categories',
    path: '/categories',
    validate: (body) => Array.isArray(body),
  },
  {
    name: 'GET /products?page=1&limit=1',
    path: '/products?page=1&limit=1',
    validate: (body) =>
      Array.isArray(body.data) &&
      typeof body.total === 'number' &&
      typeof body.totalPages === 'number',
  },
  {
    name: 'GET /inventory/summary',
    path: '/inventory/summary',
    validate: (body) =>
      typeof body.totalProducts === 'number' &&
      Array.isArray(body.topProducts),
  },
];

let failures = 0;

for (const check of checks) {
  try {
    const response = await fetch(`${baseUrl}${check.path}`, {
      headers: { Accept: check.expectJson === false ? 'text/html' : 'application/json' },
    });
    const body = check.expectJson === false
      ? await response.text()
      : await response.json();

    if (!response.ok || !check.validate(body)) {
      failures += 1;
      console.error(`FAIL ${check.name} -> ${response.status}`);
    } else {
      console.log(`OK   ${check.name} -> ${response.status}`);
    }
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${check.name} -> ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures > 0) {
  console.error(`Smoke test fallido: ${failures}/${checks.length} verificaciones.`);
  process.exit(1);
}

console.log(`Smoke test correcto: ${checks.length}/${checks.length} verificaciones.`);
