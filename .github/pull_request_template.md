## Descripción de la funcionalidad

<!-- ¿Qué hace este PR? ¿Qué problema resuelve? -->

## Archivos modificados

<!-- Lista principal de archivos o módulos tocados -->

-

## Cambios realizados en la base de datos

<!-- Migraciones, modelos, índices o restricciones. Escribir "Ninguno" si no aplica. -->

-

## Endpoints implementados

<!-- Método y ruta. Escribir "Ninguno" si no aplica. -->

-

## Validaciones agregadas

<!-- Reglas de negocio y validaciones de DTO. Escribir "Ninguna" si no aplica. -->

-

## Evidencias de pruebas

<!-- Comandos ejecutados y resultado (unitarias, integración, Swagger, etc.). -->

-

## Explicación de posibles conflictos

<!-- Conflictos encontrados al integrar develop y cómo se resolvieron. Escribir "Ninguno" si no aplica. -->

-

## Checklist del autor

- [ ] La rama parte de `develop` y el PR apunta a `develop`
- [ ] Probé la funcionalidad localmente (`npm run start:dev`)
- [ ] Ejecuté `npm run test` / `npm run test:e2e` según corresponda
- [ ] Verifiqué Swagger en `/api/docs`
- [ ] No hice push directo a `main` ni a `develop`

## Checklist del revisor

- [ ] El código es legible
- [ ] La lógica de negocio es correcta
- [ ] Las validaciones están implementadas
- [ ] No se han introducido errores
- [ ] No se han duplicado funcionalidades
- [ ] Los cambios son compatibles con el resto del sistema
- [ ] Descargué la rama y la ejecuté localmente (no solo leí el código en GitHub):

```bash
git fetch origin
git checkout feature/nombre-de-la-rama
npm install
npx prisma migrate dev
npm run start:dev
```

- [ ] Dejé comentarios cuando encontré errores o aspectos a corregir
- [ ] Aprobé el PR solo después de verificar todo lo anterior
