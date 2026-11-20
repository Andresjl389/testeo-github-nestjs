# Runbook de producción

Este runbook prepara el backend de forma genérica. La plataforma de alojamiento y la infraestructura se definirán en una etapa posterior; mientras tanto, los comandos funcionan en cualquier servidor Node.js con PostgreSQL accesible.

## 1. Principios

- Las credenciales de producción **nunca** se versionan. Se inyectan como variables de entorno secretas.
- En producción se usan archivos de migración ya existentes: **solo** `npx prisma migrate deploy`.
- `npx prisma migrate dev` se usa únicamente en local.
- La aplicación es stateless: no guarda archivos ni sesiones en disco.
- `/health` debe responder `200` antes de enviar tráfico al proceso.

## 2. Variables de entorno

Copiar la plantilla correspondiente y completarla fuera del repositorio:

```bash
cp .env.production.example .env.production.local
```

En una plataforma gestionada, crear estas variables en el panel de secretos en lugar del archivo:

| Variable | Obligatoria | Descripción |
|---|---|---|
| `NODE_ENV` | sí | Debe ser `production` |
| `DATABASE_URL` | sí | URL PostgreSQL con `sslmode=require` si aplica |
| `PORT` | no | Default `3000` |
| `HOST` | no | Default `0.0.0.0` |
| `LOG_LEVEL` | no | Default `log` |
| `SWAGGER_ENABLED` | no | Default `true` |

Validación local sin iniciar el servidor:

```bash
NODE_ENV=production DATABASE_URL="postgresql://..." npm run build
```

Si falta una variable o tiene un formato inválido, el arranque termina con `Variables de entorno inválidas: ...` y no inicia el servidor.

## 3. Arranque

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start:prod
```

Orden recomendado en un pipeline:

1. Instalar dependencias (`npm ci`).
2. Generar el cliente de Prisma (`npx prisma generate`).
3. Ejecutar `npx prisma migrate deploy` contra la base de producción.
4. Compilar (`npm run build`).
5. Iniciar `npm run start:prod`.

Si hay varias réplicas, ejecutar las migraciones **una sola vez** como paso de release, no en cada réplica.

## 4. Verificación

```bash
curl -i https://TU_HOST/health
```

- `200` y `database: "up"`: la API conecta con PostgreSQL.
- `503`: la base de datos no está disponible; revisar `DATABASE_URL`, red, firewall/TLS y logs.

Smoke test de endpoints desplegados:

```bash
BASE_URL=https://TU_HOST npm run smoke:prod
```

El script valida:

- `GET /health`
- `GET /api/docs`
- `GET /categories`
- `GET /products?page=1&limit=1`
- `GET /inventory/summary`

## 5. Errores y logs

Todas las respuestas de error usan:

```json
{
  "statusCode": 400,
  "message": "Datos inválidos",
  "error": "Bad Request",
  "timestamp": "2026-11-20T00:00:00.000Z",
  "path": "/categories"
}
```

En producción, los errores no esperados se registran en stdout con `Logger` y se devuelven como `500 Error interno del servidor`. Usar `LOG_LEVEL=warn` o `LOG_LEVEL=error` para reducir ruido; `debug`/`verbose` solo durante diagnóstico.

## 6. Checklist antes de habilitar tráfico

- [ ] `DATABASE_URL` viene de secretos y no del repositorio.
- [ ] `NODE_ENV=production`.
- [ ] `npx prisma migrate deploy` terminó sin errores.
- [ ] `npx prisma migrate status` no reporta migraciones pendientes.
- [ ] `GET /health` devuelve `200`.
- [ ] `BASE_URL=... npm run smoke:prod` pasa.
- [ ] `/api/docs` muestra los tags `app`, `categories`, `products`, `inventory-movements`, `inventory` y `health`.
- [ ] Los logs no contienen contraseñas ni tokens.
