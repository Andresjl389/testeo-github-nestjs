# Sistema de Gestión de Inventario – API REST

> **Si estás leyendo esto, ya tienes el repositorio clonado.** Revisa primero tus tareas en [Asignación de tareas](#asignación-de-tareas). Luego lee la sección [3. Estado actual del repositorio](#3-estado-actual-del-repositorio) y el [4. Plan de trabajo](#4-plan-de-trabajo). No empieces a programar módulos antes de terminar la **Fase 0**.

## Asignación de tareas

| Aprendiz | Rol | Módulos |
|---|---|---|
| **Brandon** | Desarrollador A | Categorías y productos |
| **Alejandra** | Desarrollador B | Movimientos de inventario y reportes |

Marquen cada tarea con `[x]` a medida que la terminen (pueden hacerlo dentro del mismo Pull Request de la tarea). El detalle de cada fase está en [4. Plan de trabajo](#4-plan-de-trabajo).

### Fase 0 – Preparación del entorno

| # | Tarea | Responsable | Rama | Revisa |
|---|---|---|---|---|
| 0.1 | Poner en marcha el proyecto localmente ([sección 5](#5-puesta-en-marcha-local), pasos 1 a 4) y ver el "Hello World!" | Ambos | — | — |
| [x] 0.2 | Crear y publicar la rama `develop` a partir de `main` | Alejandra | `develop` | — |
| 0.3 | Instalar Prisma (`npx prisma init`), crear el módulo/servicio de Prisma, configurar `ValidationPipe` global, configurar Swagger en `/api/docs` y crear `.env.example` | Brandon | `chore/project-setup` | Alejandra |
| [x] 0.4 | Crear la plantilla de Pull Requests `.github/pull_request_template.md` con los puntos de la [sección 12](#12-revisión-de-pull-requests) | Alejandra | `chore/pr-template` | Brandon |

- [ ] **Brandon:** 0.1, 0.3 y revisión de 0.4
- [x] **Alejandra:** 0.1, 0.2, 0.4 y revisión de 0.3

### Fase 1 – Diseño de la base de datos

| # | Tarea | Responsable | Rama | Revisa |
|---|---|---|---|---|
| 1.1 | Reunión de diseño: responder juntos las 14 preguntas de la [sección 8](#8-modelo-de-base-de-datos) | Ambos | — | — |
| 1.2 | Diagrama entidad-relación | Brandon | `feat/database-schema` | Alejandra |
| 1.3 | Escribir `prisma/schema.prisma` con los tres modelos, relaciones, restricciones e índices, y generar la migración inicial | Alejandra | `feat/database-schema` | Brandon |
| 1.4 | Completar la [sección 18](#18-decisiones-de-diseño-del-equipo-completar): equipo, diagrama, decisiones, contratos entre módulos y formato de respuestas y errores | Ambos | `feat/database-schema` | — |

Las tareas 1.2, 1.3 y 1.4 van en la **misma rama** y en un solo Pull Request, con commits de ambos. Es su primera práctica de trabajar los dos sobre la misma rama: hagan `git pull` antes de empezar a trabajar y `git push` al terminar.

- [ ] **Brandon:** 1.1, 1.2, 1.4 y revisión del Pull Request
- [ ] **Alejandra:** 1.1, 1.3, 1.4

### Fase 2 y 3 – Desarrollo e integración

Respeten **este orden de integración**: así cada uno resuelve un conflicto real en `src/app.module.ts` (ejercicio obligatorio de la [sección 11](#ejercicio-obligatorio-de-conflictos)).

| Orden | Tarea | Responsable | Rama | Revisa |
|---|---|---|---|---|
| 1 | Módulo de categorías: CRUD, validaciones, productos de una categoría, Swagger | Brandon | `feature/categories` | Alejandra |
| 2 | Módulo de movimientos: entradas, salidas, transacción con actualización del stock, historial, filtros y paginación, Swagger. **Al integrar, resolver el conflicto con el módulo de categorías.** | Alejandra | `feature/inventory-movements` | Brandon |
| 3 | Módulo de productos: CRUD, búsqueda, filtros, paginación, relación con categorías, Swagger. **Al integrar, resolver el conflicto con el módulo de movimientos.** | Brandon | `feature/products` | Alejandra |
| 4 | Módulo de reportes: `/inventory/summary`, `/inventory/low-stock`, `/inventory/out-of-stock`, Swagger | Alejandra | `feature/inventory-reports` | Brandon |

Pueden trabajar en paralelo; el orden aplica solo a **cuándo se integra** cada Pull Request en `develop`.

> **Alejandra:** para probar movimientos antes de que exista el módulo de productos, puedes crear productos de prueba directamente en la base de datos con `npx prisma studio`.

- [ ] **Brandon:** `feature/categories`, `feature/products`, conflicto en el paso 3, revisión de los PR de Alejandra
- [x] **Alejandra:** `feature/inventory-movements`
- [x] **Alejandra:** conflicto en el paso 2 (categorías + movimientos en `src/app.module.ts`)
- [x] **Alejandra:** `feature/inventory-reports`
- [ ] **Alejandra:** revisión de los PR de Brandon

### Fase 4 – Pruebas y documentación

| # | Tarea | Responsable | Rama | Revisa |
|---|---|---|---|---|
| [x] 4.1 | Pruebas unitarias y de integración de categorías y productos (creación, duplicados, eliminar categoría con productos, eliminar producto con movimientos) | Brandon | `test/categories-products` | Alejandra |
| 4.2 | Pruebas unitarias y de integración de movimientos (entradas, salidas, stock insuficiente, consistencia ante error en la transacción, errores de base de datos) | Alejandra | `test/inventory-movements` | Brandon |
| [x] 4.3 | Revisar que Swagger documente todos los endpoints y actualizar el README | Ambos | `docs/final-readme` | — |

- [x] **Brandon:** 4.1, 4.3
- [x] **Alejandra:** 4.2 (`test/inventory-movements`)
- [ ] **Alejandra:** 4.3

### Fase 5 – Producción

Se asignará en una segunda etapa ([sección 14](#14-preparación-para-producción)).

---

## Tabla de contenido

0. [Asignación de tareas](#asignación-de-tareas)
1. [Descripción del proyecto](#1-descripción-del-proyecto)
2. [Tecnologías obligatorias](#2-tecnologías-obligatorias)
3. [Estado actual del repositorio](#3-estado-actual-del-repositorio)
4. [Plan de trabajo](#4-plan-de-trabajo)
5. [Puesta en marcha local](#5-puesta-en-marcha-local)
6. [Funcionalidades del sistema](#6-funcionalidades-del-sistema)
7. [Endpoints esperados](#7-endpoints-esperados)
8. [Modelo de base de datos](#8-modelo-de-base-de-datos)
9. [Estructura sugerida del proyecto](#9-estructura-sugerida-del-proyecto)
10. [Distribución de tareas](#10-distribución-de-tareas)
11. [Reglas obligatorias de Git y GitHub](#11-reglas-obligatorias-de-git-y-github)
12. [Revisión de Pull Requests](#12-revisión-de-pull-requests)
13. [Pruebas](#13-pruebas)
14. [Preparación para producción](#14-preparación-para-producción)
15. [Entregables](#15-entregables)
16. [Criterios de evaluación](#16-criterios-de-evaluación)
17. [Consideraciones finales](#17-consideraciones-finales)
18. [Decisiones de diseño del equipo (completar)](#18-decisiones-de-diseño-del-equipo-completar)
19. [Swagger y endpoints implementados](#19-swagger-y-endpoints-implementados)

---

## 1. Descripción del proyecto

El objetivo de este proyecto es desarrollar una API REST para administrar un sistema de inventario, permitiendo gestionar productos, categorías, entradas y salidas de mercancía.

El sistema deberá garantizar la consistencia de la información, mantener un historial de movimientos y evitar operaciones que puedan generar inconsistencias en las existencias.

Este proyecto será desarrollado colaborativamente por dos desarrolladores utilizando **NestJS, PostgreSQL y GitHub**.

El proyecto se realizará inicialmente en un entorno local. Posteriormente, deberá prepararse y desplegarse en un entorno de producción.

### Objetivos de aprendizaje

Durante el desarrollo se evaluarán los siguientes conocimientos:

- Desarrollo de APIs REST con NestJS.
- Arquitectura modular y separación de responsabilidades.
- Diseño y modelado de bases de datos relacionales.
- Conexión y operaciones con PostgreSQL.
- Manejo de relaciones entre entidades.
- Implementación de lógica de negocio.
- Validaciones y manejo de excepciones.
- Manejo de transacciones en bases de datos.
- Uso de Git en un entorno colaborativo.
- Creación y revisión de Pull Requests.
- Resolución de conflictos de integración.
- Documentación de APIs con Swagger.

---

## 2. Tecnologías obligatorias

| Tecnología | Uso |
|---|---|
| Node.js | Entorno de ejecución |
| TypeScript | Lenguaje de programación |
| NestJS | Framework backend |
| PostgreSQL | Base de datos |
| Prisma ORM | Acceso y gestión de datos |
| Git | Control de versiones |
| GitHub | Repositorio y Pull Requests |
| Swagger | Documentación de endpoints |

No se requiere desarrollar frontend. Toda la interacción con el sistema deberá realizarse mediante endpoints HTTP, utilizando herramientas como Postman, Insomnia o Swagger.

---

## 3. Estado actual del repositorio

El repositorio partió del proyecto base de NestJS (`nest new`) y ya incluye las funcionalidades de las fases 1 a 4. Estado actual:

| Elemento | Estado |
|---|---|
| Proyecto NestJS con TypeScript, ESLint, Prettier y Jest | ✅ Ya existe |
| `src/main.ts`, `src/app.module.ts`, `AppController`, `AppService` | ✅ Existe y está documentado en Swagger |
| `.gitignore` que excluye `.env` y `node_modules` | ✅ Ya existe |
| Ramas `main` y `develop` | ✅ Creadas (Fase 0) |
| Prisma (`schema.prisma`, dos migraciones y `migration_lock.toml`) | ✅ Configurado (Fase 1) |
| Servicio/módulo de Prisma para NestJS | ✅ Creado |
| Validación de datos (DTOs con `class-validator`) | ✅ Configurada con `ValidationPipe` global |
| Swagger en `/api/docs` | ✅ Configurado y verificado automáticamente (sección [19](#19-swagger-y-endpoints-implementados)) |
| Archivo `.env.example` | ✅ Creado |
| Módulos de categorías, productos, movimientos y reportes | ✅ Implementados e integrados en `develop` |
| Pruebas unitarias y de integración | ✅ Implementadas (sección [13](#13-pruebas)) |

Scripts disponibles en `package.json`:

| Comando | Para qué sirve |
|---|---|
| `npm run start:dev` | Ejecuta la API en modo desarrollo (se reinicia con cada cambio) |
| `npm run build` | Compila el proyecto a la carpeta `dist/` |
| `npm run start:prod` | Ejecuta la versión compilada |
| `npm run lint` | Revisa y corrige el estilo del código |
| `npm run format` | Formatea el código con Prettier |
| `npm run test` | Ejecuta las pruebas unitarias (`*.spec.ts`) |
| `npm run test:e2e` | Ejecuta las pruebas de integración (`test/*.e2e-spec.ts`) |
| `npm run test:cov` | Ejecuta las pruebas con reporte de cobertura |

---

## 4. Plan de trabajo

Sigan las fases en orden. Las fases 0 y 1 se hacen **en equipo**; a partir de la fase 2 cada uno trabaja en sus módulos.

### Fase 0 – Preparación del entorno (ambos)

1. Cada uno sigue la sección [5. Puesta en marcha local](#5-puesta-en-marcha-local) hasta ver el "Hello World!" en `http://localhost:3000`.
2. **Uno solo** de los dos crea la rama `develop` a partir de `main` y la publica. Es la única vez que se trabaja directamente sobre `develop`:

   ```bash
   git checkout main
   git pull
   git checkout -b develop
   git push -u origin develop
   ```

3. El otro desarrollador la descarga:

   ```bash
   git fetch origin
   git checkout develop
   ```

4. **Uno solo** crea la rama `chore/project-setup` desde `develop` y configura la base técnica del proyecto:
   - Instalar Prisma y ejecutar `npx prisma init` (**una sola vez**; si los dos lo ejecutan, tendrán archivos duplicados y conflictos).
   - Crear un módulo/servicio de Prisma reutilizable por todos los módulos.
   - Instalar y configurar `class-validator` y `class-transformer` con un `ValidationPipe` global en `main.ts`.
   - Instalar y configurar `@nestjs/swagger` para que la documentación quede en `/api/docs`.
   - Crear el archivo `.env.example`.
   - Abrir un Pull Request hacia `develop`. **El otro desarrollador lo revisa y lo aprueba.**

> **Nota sobre Prisma:** la forma de configurar el cliente de Prisma cambia entre versiones mayores (ubicación del cliente generado, archivo de configuración, adaptadores de base de datos, etc.). Revisen la guía oficial de Prisma para la versión que instalen y la guía de integración con NestJS. Si algo de este README no coincide con la versión instalada, manda la documentación oficial; documenten lo que hicieron.

### Fase 1 – Diseño de la base de datos (ambos)

1. Lean juntos la sección [8. Modelo de base de datos](#8-modelo-de-base-de-datos) y respondan las preguntas de diseño.
2. Hagan el diagrama entidad-relación.
3. Escriban el `schema.prisma` en una rama `feat/database-schema` y generen la primera migración.
4. Completen la sección [18. Decisiones de diseño del equipo](#18-decisiones-de-diseño-del-equipo-completar).
5. Pull Request hacia `develop`, revisado por el compañero.

Hacer el esquema completo **antes** de los módulos evita que el Desarrollador B tenga que esperar a que exista la tabla de productos, y evita que ambos generen migraciones en paralelo que choquen entre sí.

### Fase 2 – Desarrollo en paralelo (cada uno en sus ramas)

| Desarrollador A | Desarrollador B |
|---|---|
| `feature/categories` | `feature/inventory-movements` |
| `feature/products` | `feature/inventory-reports` |

Ver detalle en [10. Distribución de tareas](#10-distribución-de-tareas).

### Fase 3 – Integración y conflicto obligatorio (ambos)

Integración por Pull Requests y resolución del conflicto en `src/app.module.ts`. Ver [Ejercicio obligatorio de conflictos](#ejercicio-obligatorio-de-conflictos).

### Fase 4 – Pruebas y documentación (ambos)

Pruebas unitarias y de integración, Swagger completo y README actualizado.

### Fase 5 – Producción

Se define en una segunda etapa. Ver [14. Preparación para producción](#14-preparación-para-producción).

---

## 5. Puesta en marcha local

### Requisitos previos

- Node.js (versión LTS compatible con NestJS y Prisma).
- npm.
- PostgreSQL.
- Git.
- Un cliente para realizar peticiones HTTP (Postman, Insomnia o Swagger).

Verifiquen las versiones instaladas:

```bash
node -v
npm -v
git --version
psql --version
```

### Paso 1. Verificar el repositorio clonado

Ubíquense en la carpeta del proyecto y revisen que el remoto y las ramas estén bien:

```bash
git remote -v
git branch -a
```

Configuren su identidad de Git (aparecerá en el historial de commits, que también se evalúa):

```bash
git config user.name "Tu Nombre"
git config user.email "tu-correo@ejemplo.com"
```

### Paso 2. Instalar dependencias

```bash
npm install
```

### Paso 3. Verificar que el proyecto base funciona

```bash
npm run start:dev
```

Abran `http://localhost:3000`. Deben ver el mensaje `Hello World!`. Si esto no funciona, resuélvanlo antes de continuar.

### Paso 4. Crear la base de datos

Desde PostgreSQL, crear una base de datos llamada:

```sql
CREATE DATABASE inventory_management;
```

### Paso 5. Configurar las variables de entorno

Una vez exista el archivo `.env.example` (Fase 0), cada uno crea su `.env` a partir de él:

```bash
cp .env.example .env
```

Ejemplo de contenido:

```env
PORT=3000

DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/inventory_management?schema=public"
```

Cada desarrollador deberá utilizar sus propias credenciales locales.

**Importante:** el archivo `.env` no debe subirse al repositorio (ya está en `.gitignore`). El archivo `.env.example` sí se sube, con las variables necesarias y valores de ejemplo **sin credenciales reales**.

### Paso 6. Configurar Prisma (solo en la Fase 0, una persona)

```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

Esto crea la carpeta `prisma/` con el archivo de esquema. Allí se define el modelo de datos (Fase 1).

### Paso 7. Ejecutar las migraciones

La **primera** migración la crea quien escriba el esquema inicial:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Después, cada vez que traigan cambios de `develop` que incluyan migraciones nuevas, apliquen esas migraciones en su base local:

```bash
npx prisma migrate dev
npx prisma generate
```

Cuando cambien el esquema, creen una migración con un nombre descriptivo:

```bash
npx prisma migrate dev --name add_index_to_product_sku
```

Reglas para trabajar en equipo con migraciones:

- Las migraciones (`prisma/migrations/`) se versionan y se suben al repositorio.
- Nunca editen una migración que ya fue integrada en `develop`; si algo está mal, creen una migración nueva.
- Avisen al compañero cuando su rama incluya una migración, para evitar que ambos creen migraciones al mismo tiempo sobre las mismas tablas.

### Paso 8. Ejecutar el proyecto

```bash
npm run start:dev
```

API disponible en: `http://localhost:3000`

### Paso 9. Documentación Swagger

Una vez configurado Swagger (Fase 0), la documentación estará disponible en:

`http://localhost:3000/api/docs`

---

## 6. Funcionalidades del sistema

### Módulo 1. Gestión de categorías

Permite administrar las categorías a las que pertenecen los productos.

**Funcionalidades:**

- Crear categorías.
- Listar todas las categorías.
- Consultar una categoría por su identificador.
- Actualizar categorías.
- Eliminar categorías.
- Consultar los productos asociados a una categoría.

**Reglas de negocio:**

1. El nombre de la categoría es obligatorio.
2. No se permiten categorías con nombres duplicados.
3. No se puede eliminar una categoría que tenga productos asociados.
4. Se deben validar los identificadores antes de realizar operaciones.

### Módulo 2. Gestión de productos

Permite administrar los productos del inventario.

**Información mínima de un producto:**

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| name | String | Nombre del producto |
| description | String | Descripción |
| sku | String | Código único del producto |
| price | Decimal | Precio unitario |
| stock | Integer | Existencias actuales |
| minStock | Integer | Nivel mínimo de existencias |
| categoryId | UUID | Categoría asociada |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Fecha de actualización |

**Funcionalidades:**

- Crear productos.
- Listar productos.
- Consultar producto por identificador.
- Actualizar productos.
- Eliminar productos.
- Buscar productos por nombre o SKU.
- Filtrar productos por categoría.
- Filtrar productos con existencias bajas.
- Implementar paginación en los listados.

**Reglas de negocio:**

1. El nombre del producto es obligatorio.
2. El SKU debe ser único.
3. El precio debe ser mayor que cero.
4. El stock inicial no puede ser negativo.
5. El stock mínimo no puede ser negativo.
6. Todo producto debe pertenecer a una categoría existente.
7. No se debe permitir eliminar un producto que tenga movimientos de inventario registrados.
8. Los cambios de existencias posteriores a la creación deben realizarse mediante movimientos de inventario, no mediante una actualización directa del stock.

### Módulo 3. Movimientos de inventario

Este módulo permitirá registrar todas las entradas y salidas de productos.

**Tipos de movimientos:**

- IN: Entrada de inventario.
- OUT: Salida de inventario.

**Información mínima de un movimiento:**

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador del movimiento |
| productId | UUID | Producto relacionado |
| type | Enum | IN u OUT |
| quantity | Integer | Cantidad del movimiento |
| description | String | Motivo del movimiento |
| createdAt | DateTime | Fecha del movimiento |

**Funcionalidades:**

- Registrar entrada de inventario.
- Registrar salida de inventario.
- Consultar movimientos.
- Consultar movimientos por producto.
- Consultar movimientos por tipo.
- Consultar movimientos por rango de fechas.
- Consultar el historial de movimientos de un producto.

**Reglas de negocio:**

1. Todo movimiento debe estar asociado a un producto existente.
2. La cantidad debe ser un número entero mayor que cero.
3. Una entrada debe incrementar las existencias del producto.
4. Una salida debe disminuir las existencias del producto.
5. No se puede realizar una salida si no existe suficiente inventario.
6. Cada movimiento debe generar un registro histórico.
7. No se deben modificar las existencias directamente desde el módulo de productos.
8. El registro del movimiento y la actualización del stock deben ejecutarse dentro de una transacción de base de datos.
9. Si ocurre un error durante el movimiento, ninguna de las operaciones debe quedar aplicada parcialmente.
10. No se deben eliminar movimientos históricos.

### Módulo 4. Consulta de inventario

Se deberá implementar una funcionalidad que permita consultar el estado general del inventario.

**Información esperada:**

- Cantidad total de productos registrados.
- Cantidad total de unidades disponibles.
- Productos con stock bajo.
- Productos sin existencias.
- Valor total del inventario, calculado a partir del precio y las existencias.
- Productos con mayor cantidad de movimientos.

Esta información deberá obtenerse mediante consultas a la base de datos, evitando realizar cálculos innecesarios en el cliente.

---

## 7. Endpoints esperados

Los siguientes endpoints son una guía funcional. Los desarrolladores podrán proponer ajustes siempre que mantengan las funcionalidades solicitadas. El listado **realmente implementado**, con sus códigos de respuesta y su verificación Swagger, está en la [sección 19](#19-swagger-y-endpoints-implementados).

### Categorías

| Método | Endpoint | Descripción |
|---|---|---|
| POST | /categories | Crear categoría |
| GET | /categories | Listar categorías |
| GET | /categories/:id | Consultar categoría |
| PATCH | /categories/:id | Actualizar categoría |
| DELETE | /categories/:id | Eliminar categoría |

### Productos

| Método | Endpoint | Descripción |
|---|---|---|
| POST | /products | Crear producto |
| GET | /products | Listar productos |
| GET | /products/:id | Consultar producto |
| PATCH | /products/:id | Actualizar producto |
| DELETE | /products/:id | Eliminar producto |

El listado deberá soportar parámetros como:

- page
- limit
- search
- categoryId
- lowStock

Ejemplo:

```
GET /products?page=1&limit=10&search=teclado
```

### Movimientos

| Método | Endpoint | Descripción |
|---|---|---|
| POST | /inventory-movements | Registrar movimiento |
| GET | /inventory-movements | Listar movimientos |
| GET | /inventory-movements/:id | Consultar movimiento |
| GET | /inventory-movements/product/:productId | Historial de un producto |

Los listados deberán permitir filtrar por:

- type
- productId
- startDate
- endDate
- page
- limit

### Reportes

| Método | Endpoint | Descripción |
|---|---|---|
| GET | /inventory/summary | Resumen general |
| GET | /inventory/low-stock | Productos con stock bajo |
| GET | /inventory/out-of-stock | Productos sin existencias |

### Formato de respuestas y errores

Formato común acordado y aplicado por todos los módulos:

- Respuestas paginadas: `data`, `total`, `page`, `limit`, `totalPages`.
- Errores: `statusCode`, `message`, `error`, `timestamp`, `path`, con códigos `400`, `404`, `409`, etc.

El acuerdo completo quedó documentado en la sección [18](#18-decisiones-de-diseño-del-equipo-completar).

---

## 8. Modelo de base de datos

Las entidades y relaciones de esta sección son el **punto de partida mínimo**. El diseño final —tipos de datos, relaciones, restricciones e índices— **lo deben construir ustedes**, en equipo, durante la Fase 1.

### Entidades mínimas

#### Category

- id
- name
- description
- createdAt
- updatedAt

#### Product

- id
- name
- description
- sku
- price
- stock
- minStock
- categoryId
- createdAt
- updatedAt

#### InventoryMovement

- id
- productId
- type
- quantity
- description
- createdAt

### Relaciones

- Una categoría puede tener muchos productos.
- Un producto pertenece a una categoría.
- Un producto puede tener muchos movimientos.
- Cada movimiento pertenece a un producto.

El identificador principal de las entidades deberá ser UUID.

### Preguntas que deben resolver en el diseño

No hay una única respuesta correcta para todas, pero sí deben poder **justificar** cada decisión.

**Tipos de datos**

1. ¿Qué tipo de dato usarán para `price`? ¿Por qué no es buena idea usar `Float` para dinero? ¿Qué precisión y escala necesitan?
2. ¿Cómo representarán el tipo de movimiento (`IN` / `OUT`) en Prisma y cómo queda en PostgreSQL?
3. ¿Qué campos son obligatorios y cuáles opcionales (por ejemplo, `description`)?
4. ¿Quién genera el UUID: la aplicación o la base de datos?
5. ¿Cómo se llenan automáticamente `createdAt` y `updatedAt`? ¿Por qué `InventoryMovement` no tiene `updatedAt`?

**Relaciones**

6. ¿En qué tabla queda la llave foránea de cada relación? ¿Cómo se declara la relación en **ambos** modelos dentro de `schema.prisma`?
7. ¿Qué debe pasar en la base de datos si alguien intenta eliminar una categoría que tiene productos? ¿Y un producto que tiene movimientos? Investiguen las opciones de `onDelete` (`Cascade`, `Restrict`, `SetNull`, `NoAction`) y elijan la que proteja las reglas de negocio.
8. ¿Esas reglas se validan solo en el servicio, solo en la base de datos o en ambos? ¿Qué ventaja tiene cada opción?

**Restricciones e índices**

9. ¿Qué campos deben ser únicos?
10. ¿Por qué columnas se filtra o busca con frecuencia? (Pista: revisen los parámetros de los endpoints de la sección 7.) ¿Cuáles deberían tener índice?
11. ¿Es posible impedir que `stock` sea negativo desde la propia base de datos y no solo desde el código? ¿Cómo se haría con Prisma y PostgreSQL?

**Convenciones**

12. ¿Los nombres de tablas y columnas en PostgreSQL quedarán en `camelCase` o en `snake_case`? (Investiguen `@map` y `@@map` en Prisma.)

**Contratos entre módulos**

13. Al registrar un movimiento hay que actualizar el `stock` del producto. ¿El módulo de movimientos usa directamente Prisma sobre la tabla de productos dentro de la transacción, o llama a un método del módulo de productos? ¿Qué implica cada opción para la transacción?
14. ¿Qué métodos del módulo de productos necesita el módulo de movimientos y cuál será su firma?

### Entregables de la Fase 1

- Diagrama entidad-relación (puede ser con [Mermaid](https://mermaid.js.org/syntax/entityRelationshipDiagram.html) dentro de este README, dbdiagram.io, draw.io u otra herramienta).
- `prisma/schema.prisma` con los tres modelos, sus relaciones, restricciones e índices.
- Migración inicial en `prisma/migrations/`.
- Sección [18](#18-decisiones-de-diseño-del-equipo-completar) completada con las respuestas a las preguntas anteriores.

---

## 9. Estructura sugerida del proyecto

Es una sugerencia; pueden ajustarla si lo justifican.

```
prisma/
├── schema.prisma
└── migrations/
src/
├── main.ts
├── app.module.ts
├── prisma/                   # Módulo y servicio de Prisma (compartido)
├── categories/
│   ├── dto/
│   ├── categories.controller.ts
│   ├── categories.service.ts
│   ├── categories.service.spec.ts
│   └── categories.module.ts
├── products/
├── inventory-movements/
└── inventory/                # Reportes
test/
└── *.e2e-spec.ts             # Pruebas de integración
```

El CLI de NestJS puede generar la estructura base de un módulo:

```bash
npx nest g resource categories
```

Revisen lo que genera: eliminen o ajusten lo que no se use.

---

## 10. Distribución de tareas

El proyecto será desarrollado por dos aprendices.

### Desarrollador A – Productos y categorías (Brandon)

Responsabilidades:

- Configurar el módulo de categorías.
- Implementar el CRUD de categorías.
- Implementar sus validaciones.
- Configurar el módulo de productos.
- Implementar el CRUD de productos.
- Implementar búsqueda, filtros y paginación.
- Implementar las relaciones entre productos y categorías.
- Documentar sus endpoints.

### Desarrollador B – Movimientos e inventario (Alejandra)

Responsabilidades:

- Configurar el módulo de movimientos.
- Implementar el registro de entradas.
- Implementar el registro de salidas.
- Implementar la actualización automática del stock.
- Implementar las transacciones de base de datos.
- Implementar el historial de movimientos.
- Implementar filtros por producto, tipo y fechas.
- Implementar los reportes de inventario.
- Documentar sus endpoints.

### Responsabilidades compartidas

Ambos desarrolladores deberán:

- Configurar la base técnica del proyecto (Fase 0).
- Participar en el diseño inicial de la base de datos (Fase 1).
- Acordar los contratos entre módulos.
- Revisar el código del compañero.
- Resolver conflictos de integración.
- Mantener actualizado el README cuando corresponda.
- Verificar que los cambios integrados no rompan funcionalidades existentes.

---

## 11. Reglas obligatorias de Git y GitHub

Este proyecto debe desarrollarse siguiendo un flujo de trabajo colaborativo.

### Ramas principales

| Rama | Propósito |
|---|---|
| main | Código estable y preparado para producción |
| develop | Rama de integración de funcionalidades |

### Ramas de trabajo

Cada desarrollador deberá crear ramas independientes **a partir de `develop`**.

Ejemplos:

- chore/project-setup
- feat/database-schema
- feature/categories
- feature/products
- feature/inventory-movements
- feature/inventory-reports
- fix/product-validation
- fix/inventory-stock

### Flujo de trabajo de una rama

```bash
# 1. Partir siempre de develop actualizado
git checkout develop
git pull origin develop

# 2. Crear la rama de trabajo
git checkout -b feature/categories

# 3. Trabajar y hacer commits pequeños y descriptivos
git add .
git commit -m "feat: create category module"

# 4. Antes de abrir el PR, traer lo último de develop
git fetch origin
git merge origin/develop
# (resolver conflictos si aparecen, probar que todo funcione)

# 5. Publicar la rama
git push -u origin feature/categories

# 6. Abrir el Pull Request en GitHub hacia develop
```

### Reglas de trabajo

1. Está prohibido realizar push directamente a `main` o `develop` (excepto la creación inicial de `develop` en la Fase 0).
2. Todas las funcionalidades deben desarrollarse en ramas independientes.
3. Los cambios deben integrarse mediante Pull Requests.
4. Todos los Pull Requests deberán dirigirse a `develop`.
5. Cada desarrollador deberá revisar los Pull Requests del compañero.
6. Ningún desarrollador podrá aprobar su propio Pull Request.
7. Los Pull Requests deberán incluir una descripción de los cambios.
8. Los commits deben tener mensajes descriptivos.
9. Se deberá actualizar la rama de trabajo cuando `develop` tenga nuevos cambios.
10. Se deberán resolver los conflictos de Git sin eliminar funcionalidades implementadas por el compañero.

### Formato recomendado para commits

Utilizar una convención de commits:

- `feat`: nueva funcionalidad.
- `fix`: corrección de errores.
- `refactor`: reorganización del código.
- `docs`: documentación.
- `test`: pruebas.
- `chore`: tareas de mantenimiento.

Ejemplos:

```
feat: create product module
feat: register inventory entry
fix: prevent negative inventory
docs: update installation guide
```

### Ejercicio obligatorio de conflictos

Durante el desarrollo, ambos deberán modificar el archivo principal de integración de módulos:

`src/app.module.ts`

Cuando cada uno registre su módulo en el arreglo `imports` desde su propia rama, los dos estarán modificando las mismas líneas. Al integrar el segundo Pull Request se presentará un conflicto que deberán resolver.

No se permite solucionar el conflicto eliminando el módulo o los cambios del otro desarrollador.

Deberán demostrar que saben:

- Identificar el origen del conflicto.
- Actualizar su rama con `develop`.
- Resolver los marcadores de conflicto (`<<<<<<<`, `=======`, `>>>>>>>`).
- Verificar que ambos módulos estén registrados.
- Ejecutar el proyecto después de resolver el conflicto.
- Actualizar el Pull Request con la solución.

Como evidencia, documenten en el Pull Request: captura del conflicto, cómo lo resolvieron y captura del proyecto funcionando con ambos módulos.

---

## 12. Revisión de Pull Requests

Cada Pull Request deberá incluir:

- Descripción de la funcionalidad.
- Archivos modificados.
- Cambios realizados en la base de datos.
- Endpoints implementados.
- Validaciones agregadas.
- Evidencias de pruebas.
- Explicación de posibles conflictos.

> **Recomendación:** creen el archivo `.github/pull_request_template.md` con estos puntos para que GitHub los cargue automáticamente al abrir cada Pull Request.

El desarrollador que revise el Pull Request deberá comprobar:

- Que el código sea legible.
- Que la lógica de negocio sea correcta.
- Que las validaciones estén implementadas.
- Que no se hayan introducido errores.
- Que no se hayan duplicado funcionalidades.
- Que los cambios sean compatibles con el resto del sistema.

Para revisar bien, descarguen la rama del compañero y ejecútenla localmente; no se limiten a leer el código en GitHub:

```bash
git fetch origin
git checkout feature/nombre-de-la-rama
npm install
npx prisma migrate dev
npm run start:dev
```

Se deberán dejar comentarios cuando se encuentren errores o aspectos que deban corregirse.

---

## 13. Pruebas

El proyecto deberá incluir pruebas para las funcionalidades principales.

Como mínimo, se deberá probar:

- Creación de productos.
- Creación de categorías.
- Validación de productos duplicados.
- Validación de categorías duplicadas.
- Registro de entradas de inventario.
- Registro de salidas de inventario.
- Intento de salida con stock insuficiente.
- Intento de eliminar una categoría con productos asociados.
- Intento de eliminar un producto con movimientos registrados.
- Manejo de errores de base de datos.
- Consistencia de existencias cuando ocurre un error en una transacción.

Se deberán incluir pruebas unitarias y pruebas de integración para las reglas de negocio más importantes.

- **Unitarias** (`src/**/*.spec.ts`, se ejecutan con `npm run test`): prueban servicios aislados, simulando (mock) el acceso a la base de datos.
- **Integración** (`test/*.e2e-spec.ts`, se ejecutan con `npm run test:e2e`): prueban los endpoints por HTTP (controladores, pipes, DTOs y servicios reales). `test/categories-products.e2e-spec.ts` usa un doble en memoria de `PrismaService` que replica `UNIQUE` y `ON DELETE RESTRICT`, así que no depende de PostgreSQL. `test/swagger.e2e-spec.ts` genera el documento OpenAPI y comprueba que cubra todas las rutas. `test/inventory-movements.e2e-spec.ts` se ejecuta solo cuando se define `TEST_DATABASE_URL`; sin esa variable sus 8 pruebas aparecen como omitidas. Para ejecutarlas, use una base separada (`inventory_management_test`) para no borrar sus datos de desarrollo.

Estado verificado en `develop`: `npm run build`, `npm run test` (30 pruebas) y `npm run test:e2e` (12 pruebas en verde: 7 de integración de categorías/productos, 4 de Swagger y la del `AppController`; 8 pruebas de movimientos quedan omitidas al no definir `TEST_DATABASE_URL`).

---

## 14. Preparación para producción

La primera etapa del proyecto se realizará localmente.

Una vez finalizada y aprobada la implementación local, se deberá preparar el backend para producción.

Esta segunda etapa deberá contemplar:

- Configuración de una base de datos PostgreSQL de producción.
- Configuración de variables de entorno seguras.
- Separación de configuraciones locales y productivas.
- Ejecución de migraciones mediante Prisma.
- Configuración del servidor de producción.
- Manejo de errores y registros.
- Verificación de conectividad con la base de datos.
- Pruebas de los endpoints desplegados.

**Importante:** las migraciones en producción deben ejecutarse con:

```bash
npx prisma migrate deploy
```

No se deberá utilizar `prisma migrate dev` en producción.

Las credenciales de producción nunca deberán almacenarse en el repositorio.

La plataforma de alojamiento y la infraestructura de producción serán definidas en una segunda etapa.

---

## 15. Entregables

Al finalizar el proyecto, se deberá entregar:

1. Repositorio de GitHub con el código fuente.
2. API desarrollada con NestJS.
3. Base de datos PostgreSQL correctamente estructurada.
4. Migraciones de Prisma.
5. Archivo `.env.example`.
6. Documentación Swagger.
7. Pruebas de las funcionalidades principales.
8. README actualizado con instrucciones de instalación y la sección 18 completa.
9. Historial de commits.
10. Pull Requests realizados y revisados.
11. Evidencias de resolución de conflictos.
12. Proyecto funcionando localmente.

---

## 16. Criterios de evaluación

| Criterio | Puntaje |
|---|---:|
| Lógica de negocio | 25 |
| Base de datos y SQL | 15 |
| NestJS y arquitectura | 15 |
| Git y resolución de conflictos | 20 |
| Pull Requests y revisión de código | 15 |
| Documentación y pruebas | 10 |
| **Total** | **100** |

La evaluación será individual, incluso cuando el proyecto sea desarrollado colaborativamente.

Cada desarrollador deberá demostrar conocimiento sobre el código que implementó y sobre los cambios que integró del compañero.

---

## 17. Consideraciones finales

Este proyecto busca simular un entorno de desarrollo real.

No se evaluará únicamente que los endpoints funcionen. También se tendrá en cuenta la calidad del código, la organización, las decisiones técnicas, el manejo de errores, el trabajo colaborativo y la capacidad para resolver problemas.

Los desarrolladores tendrán libertad para proponer mejoras técnicas, siempre que cumplan los requerimientos funcionales y respeten las reglas de trabajo establecidas.

**El objetivo no es solamente entregar una API funcional, sino demostrar que se tienen las competencias necesarias para participar en un equipo de desarrollo backend.**

---

## 18. Decisiones de diseño del equipo (completar)

> Esta sección se completó durante la Fase 1 y se mantiene actualizada.

**Equipo**

| Rol | Nombre | Usuario de GitHub |
|---|---|---|
| Desarrollador A – Productos y categorías | Brandon | BrandonMor115 |
| Desarrollador B – Movimientos e inventario | Alejandra | ghilarybazan11-bot |

### Diagrama entidad-relación

```mermaid
erDiagram
    CATEGORY   ||..o{ PRODUCT : "tiene (0..N)"
    PRODUCT    ||..o{ INVENTORY_MOVEMENT : "registra (0..N)"

    CATEGORY {
        uuid id PK "UUID v4 generado por la app"
        text name UK "obligatorio y único"
        text description "opcional (NULL)"
        timestamp created_at "DEFAULT CURRENT_TIMESTAMP"
        timestamp updated_at "actualizado por Prisma (@updatedAt)"
    }

    PRODUCT {
        uuid id PK "UUID v4 generado por la app"
        text name "obligatorio (no único)"
        text description "opcional (NULL)"
        text sku UK "obligatorio y único"
        numeric price "Decimal(12,2), mayor que 0"
        int stock "mayor o igual que 0, DEFAULT 0"
        int min_stock "mayor o igual que 0, DEFAULT 0"
        uuid category_id FK "NOT NULL, ON DELETE RESTRICT"
        timestamp created_at "DEFAULT CURRENT_TIMESTAMP"
        timestamp updated_at "actualizado por Prisma (@updatedAt)"
    }

    INVENTORY_MOVEMENT {
        uuid id PK "UUID v4 generado por la app"
        uuid product_id FK "NOT NULL, ON DELETE RESTRICT"
        movement_type type "enum IN/OUT, NOT NULL"
        int quantity "mayor que 0"
        text description "opcional (NULL)"
        timestamp created_at "DEFAULT CURRENT_TIMESTAMP"
    }
```

**Cómo leerlo:** `||` significa "exactamente uno" y `o{` significa "cero o muchos"; la línea punteada (`..`) indica una relación **no identificante** (la FK no forma parte de la PK del hijo). Por ejemplo, `CATEGORY ||..o{ PRODUCT` se lee: *una categoría tiene cero o muchos productos, y cada producto pertenece a exactamente una categoría*. Las dos FK son `NOT NULL` y usan `ON DELETE RESTRICT`: no se puede borrar una categoría con productos ni un producto con movimientos. El diagrama también existe en formato DBML en [`docs/er-diagram.dbml`](docs/er-diagram.dbml) para renderizarlo en dbdiagram.io.

### Decisiones de la base de datos

| # | Pregunta | Decisión | Justificación |
|---|---|---|---|
| 1 | Tipo de dato de `price` | `Decimal @db.Decimal(12, 2)` → `numeric(12,2)` en PostgreSQL | `Float` usa IEEE-754: `0.1 + 0.2 !== 0.3`, por lo que acumula errores al sumar precios o calcular el valor del inventario. `numeric` es decimal exacto. Precisión 12 y escala 2 permiten hasta `9.999.999.999,99`. En JSON se serializa con `toString()` para no perder precisión. |
| 2 | Representación de `IN` / `OUT` | Enum de Prisma `MovementType { IN OUT }`, mapeado a `movement_type` en PostgreSQL | La BD rechaza valores inválidos y TypeScript tiene tipado estático, sin strings mágicos. La alternativa (`String` + `CHECK`) facilita agregar valores nuevos, pero pierde tipado. |
| 3 | Campos opcionales | `description` opcional en las tres entidades; el resto obligatorio | La descripción es información complementaria. Los ID, FK, precios, cantidades y fechas son necesarios para la integridad; `categoryId` y `productId` nunca son `NULL` para evitar huérfanos. En DTOs se usa `@IsOptional()`. |
| 4 | Generación de UUID | La aplicación, con `@default(uuid())` + `@db.Uuid` | Todo lo que escribe pasa por Prisma; no dependemos de extensiones de PostgreSQL y las pruebas unitarias pueden simular el ID. Alternativa descartada: `gen_random_uuid()` de la BD, útil solo si hay insertos directos por SQL. |
| 5 | Manejo de `createdAt` / `updatedAt` | `createdAt @default(now())` (lo llena la BD) y `updatedAt @updatedAt` (lo actualiza Prisma Client). `InventoryMovement` solo tiene `createdAt` | Un movimiento es un evento inmutable (append-only): no se edita ni se elimina, así que `updatedAt` siempre sería igual a `createdAt` y sugeriría que el historial se puede alterar. |
| 6 | Ubicación de llaves foráneas | `products.category_id` e `inventory_movements.product_id` | La FK va en el lado "muchos". En Prisma se declara en ambos modelos: campo escalar + `@relation(fields: [...], references: [id], onDelete: Restrict)` en el hijo, y campo de lista (`Product[]`, `InventoryMovement[]`) en el padre. |
| 7 | `onDelete` en las dos relaciones | `Restrict` en Category → Product y en Product → InventoryMovement | `Cascade` borraría el historial de movimientos; `SetNull` dejaría productos huérfanos y además Prisma no lo permite en relaciones obligatorias; `NoAction` es casi equivalente pero se puede diferir. PostgreSQL devuelve `23503` / Prisma `P2003` → HTTP `409`. |
| 8 | Validación de reglas: servicio, BD o ambos | **Ambos** | El servicio devuelve mensajes claros y códigos HTTP adecuados (`400`, `404`, `409`) y evita consultas innecesarias. La BD garantiza los invariantes ante escrituras directas y condiciones de carrera (dos `OUT` simultáneos). |
| 9 | Campos únicos | `Category.name`, `Product.sku` y los tres `id` (PK) | Son las reglas de negocio: nombres de categoría no repetidos y SKU único. `Product.name` no es único: dos productos pueden llamarse igual con distinto SKU. |
| 10 | Índices | `category_id`; `name` (B-tree); `(stock, min_stock)`; `(product_id, created_at)`; `(type, created_at)`; índices GIN trigram sobre `name` y `sku` pendientes para `search` | Corresponden a los filtros de la sección 7. PostgreSQL no indexa automáticamente las FK. El índice B-tree de `name` sirve para igualdad y ordenamiento; un `contains` genera `ILIKE '%texto%'`, que requiere `pg_trgm` y se añadirá cuando se implemente `?search=`. |
| 11 | Stock no negativo a nivel de BD | `CHECK (stock >= 0)`, `CHECK (min_stock >= 0)`, `CHECK (price > 0)` y `CHECK (quantity > 0)` en la migración inicial | Prisma 7 no permite `CHECK` en `schema.prisma`, así que se agregaron con SQL crudo en `prisma/migrations/20261120000000_init/migration.sql`. La aplicación además usa `updateMany` con `stock >= quantity` en el `where` para ser atómica ante concurrencia. |
| 12 | Convención de nombres en PostgreSQL | camelCase en TypeScript, snake_case en PostgreSQL con `@map` y `@@map` | `categories`, `products`, `inventory_movements`, `category_id`, `product_id`, `min_stock`, `created_at`, `updated_at`, `movement_type`. Cada lenguaje mantiene su convención. |

Índice trigram para búsquedas (se aplicará cuando se implemente `?search=`; no se incluyó en la migración inicial para no exigir la extensión `pg_trgm` en todos los entornos):

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX idx_products_sku_trgm  ON products USING GIN (sku gin_trgm_ops);
```

### Contratos entre módulos

`ProductsModule` exporta `ProductsService`; `InventoryMovementsModule` lo importa (nunca al revés, para evitar dependencia circular). `UpdateProductDto` **no expone `stock`**: los cambios de existencias solo ocurren vía movimientos.

`ProductsService` expone un método de escritura de bajo nivel:

```ts
async applyMovement(
  productId: string,
  movement: { type: MovementType; quantity: number },
  tx: Prisma.TransactionClient, // obligatorio: evita escribir fuera de la transacción
): Promise<void>
```

- `IN`: `tx.product.updateMany({ where: { id: productId }, data: { stock: { increment: quantity } } })`.
- `OUT`: `tx.product.updateMany({ where: { id: productId, stock: { gte: quantity } }, data: { stock: { decrement: quantity } } })`; si `count === 0`, se distingue entre producto inexistente (`404`) y stock insuficiente (`409`).
- También se expone `exists(productId, tx?)` para validaciones de lectura.

`InventoryMovementsService` orquesta la transacción:

```ts
async register(dto: CreateMovementDto) {
  return this.prisma.$transaction(async (tx) => {
    await this.products.applyMovement(dto.productId, dto, tx);
    return tx.inventoryMovement.create({ data: { ...dto } });
  });
}
```

Se eligió llamar al servicio de productos **pasando `tx`** en lugar de usar `this.prisma.product` directamente: conserva el límite entre módulos y mantiene la atomicidad. Si el método usara el cliente global, el `update` ocurriría fuera de la transacción y una falla en `create` dejaría el stock modificado. Cualquier error hace `ROLLBACK`, cumpliendo las reglas 8 y 9 del módulo de movimientos.

### Formato de respuestas y errores

Formato acordado por el equipo y usado por todos los módulos:

```json
{
  "data": [],
  "total": 42,
  "page": 1,
  "limit": 10
}
```

```json
{
  "statusCode": 409,
  "message": "No se puede eliminar la categoría porque tiene productos asociados",
  "error": "Conflict",
  "timestamp": "2026-11-20T00:00:00.000Z",
  "path": "/categories/:id"
}
```

Códigos acordados: `400` validación de DTO, `404` recurso inexistente, `409` duplicados (`P2002`), FK Restrict (`P2003`) o CHECK violado, stock insuficiente y movimientos sobre producto inexistente. Ambos módulos usan el mismo formato.

---

## 19. Swagger y endpoints implementados

### Cómo acceder

```bash
npm run start:dev
```

Abre `http://localhost:3000/api/docs`. La configuración (título, descripción, versión, servidor y los 5 tags) está centralizada en `src/swagger.config.ts` y la usa `src/main.ts`.

### Cobertura de documentación

| Tag | Método | Ruta | Éxito | Errores documentados |
|---|---|---|---|---|
| app | GET | `/` | 200 | — |
| categories | POST | `/categories` | 201 | 400, 409 |
| categories | GET | `/categories` | 200 | — |
| categories | GET | `/categories/{id}` | 200 | 400, 404 |
| categories | GET | `/categories/{id}/products` | 200 | 400, 404 |
| categories | PATCH | `/categories/{id}` | 200 | 400, 404, 409 |
| categories | DELETE | `/categories/{id}` | 204 | 400, 404, 409 |
| products | POST | `/products` | 201 | 400, 404, 409 |
| products | GET | `/products` | 200 | 400 |
| products | GET | `/products/{id}` | 200 | 400, 404 |
| products | PATCH | `/products/{id}` | 200 | 400, 404, 409 |
| products | DELETE | `/products/{id}` | 204 | 400, 404, 409 |
| inventory-movements | POST | `/inventory-movements` | 201 | 400, 404, 409 |
| inventory-movements | GET | `/inventory-movements` | 200 | 400 |
| inventory-movements | GET | `/inventory-movements/product/{productId}` | 200 | 400, 404 |
| inventory-movements | GET | `/inventory-movements/{id}` | 200 | 400, 404 |
| inventory | GET | `/inventory/summary` | 200 | — |
| inventory | GET | `/inventory/low-stock` | 200 | 400 |
| inventory | GET | `/inventory/out-of-stock` | 200 | 400 |

**Total: 12 rutas y 19 operaciones**, todas con `@ApiTags`, `@ApiOperation` y al menos una respuesta 2xx documentada.

Parámetros de consulta relevantes:

- `GET /products`: `page`, `limit`, `search`, `categoryId`, `lowStock`.
- `GET /inventory-movements` y `GET /inventory-movements/product/{productId}`: `page`, `limit`, `type`, `productId`, `startDate`, `endDate`.
- `GET /inventory/low-stock` y `GET /inventory/out-of-stock`: `page`, `limit`.

Todos los `id` y `productId` de ruta usan `ParseUUIDPipe`, por lo que Swagger los muestra con `format: uuid` y responde `400` si el valor no es válido.

### Verificación automática

`test/swagger.e2e-spec.ts` genera el documento OpenAPI con la misma configuración que `main.ts` y comprueba que:

1. El título, la versión y la descripción sean los esperados.
2. Estén los 5 tags y las 12 rutas / 19 operaciones.
3. Cada operación tenga `summary`, `tags` y una respuesta `2xx`.
4. Estén los esquemas de entidades y DTOs, y que los parámetros de ruta sean UUID.

Para ejecutar toda la verificación:

```bash
npm run build
npm run test
npm run test:e2e
```

Evidencia sugerida para el PR: captura de `/api/docs` mostrando los tags `app`, `categories`, `products`, `inventory-movements` e `inventory`, y el resultado de `npm run test:e2e` con las 12 pruebas en verde (más 8 omitidas por no definir `TEST_DATABASE_URL`).
