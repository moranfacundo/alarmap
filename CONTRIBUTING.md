# Cómo contribuir a AlarMap

Gracias por tu interés. Este documento explica el flujo de trabajo. Para levantar el proyecto en local,
mira el [README](README.md).

## Flujo de trabajo (GitHub Flow)

- `main` siempre debe estar estable. Nadie sube directo a `main`: todo entra por Pull Request.
- Crea una rama desde `main` actualizada (o desde tu fork), haz tus cambios y abre un Pull Request.
- El PR debe pasar el check `ci` (tipos y pruebas). Se fusiona con **squash**: el título del PR queda
  como mensaje del commit en `main`, así que escríbelo bien.

### Nombres de rama

`tipo/descripcion-corta-en-minusculas`, con uno de estos tipos:

| Tipo | Uso |
|------|-----|
| `feat/` | Funcionalidad nueva (`feat/motor-alarmas-android`) |
| `fix/` | Corrección de un error (`fix/orden-de-alarmas`) |
| `docs/` | Solo documentación |
| `refactor/` | Cambio interno sin alterar el comportamiento |
| `test/` | Pruebas |
| `chore/` | Mantenimiento, dependencias, versiones (`chore/version-0.2.0`) |

## Mensajes de commit

En **español**, claros y cortos:

- Primera línea de hasta 72 caracteres, en tercera persona y presente: `Agrega selector circular de hora`,
  `Corrige el orden de alarmas con la misma hora`.
- Si hace falta, una línea en blanco y un cuerpo que explique **por qué** (el qué ya lo dice el código).
- Un commit = un cambio con sentido. Evita mezclar temas.

## Antes de abrir el Pull Request

```sh
npm run typecheck
npm test
```

Si tocaste Kotlin o algo nativo, pruébalo también en un dispositivo (ver el README).

## Estilo del código

- **Comentarios y documentación en español**: explican el porqué, no lo obvio.
- Formato con Prettier (`.prettierrc`): comillas simples, 100 columnas.
- Respeta la arquitectura de `docs/ARCHITECTURE.md`: dominio puro, datos en SQLite, estado en signals,
  y nada de `setTimeout`/`setInterval` para programar alarmas (eso es trabajo del motor Kotlin).
- Los colores salen de `src/app/shared/theme/palette.ts`; no agregues colores sueltos.

## Versiones y tags

Se usa [SemVer](https://semver.org/lang/es/): `vMAJOR.MINOR.PATCH`. Mientras la versión sea `0.x`, un cambio
`minor` puede traer cambios incompatibles. Los tags son **anotados** y solo se crean sobre `main`.

1. Crea la rama `chore/version-X.Y.Z`.
2. Ejecuta `npm run version:bump -- X.Y.Z` (actualiza `package.json`, `app.json` y `android.versionCode`).
3. Mueve lo de `[Sin publicar]` a una sección nueva `[X.Y.Z]` en `CHANGELOG.md`.
4. Abre el PR y fusiónalo.
5. Desde `main` actualizado:
   ```sh
   git tag -a vX.Y.Z -m "Versión X.Y.Z"
   git push origin vX.Y.Z
   gh release create vX.Y.Z --title "AlarMap X.Y.Z" --notes-file <notas>   # --prerelease mientras sea 0.x
   ```
