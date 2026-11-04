@AGENTS.md

# AlarMap — contexto permanente

Android-only alarm/reminder app. Angular Native (Expo SDK 58, RN 0.88, Angular 22) + Kotlin (Expo Modules API) + SQLite. Especificación funcional en `docs/PROJECT_SPEC.md`; decisiones abiertas en `docs/OPEN_DECISIONS.md`.

## Reglas duras
- npm only (un solo `package-lock.json`). Sin ng new / Ionic / NativeScript / RN directo / Angular Material.
- Prohibido `setTimeout`/`setInterval` para programar alarmas: todo scheduling en Kotlin (`AlarmManager`).
- SQLite = fuente de verdad. Snapshot nativo (si existe) = solo proyección de recuperación.
- Sin backend, red, auth, analytics, ads, descarga/importación de tonos.
- Volumen = volumen de alarma del sistema (`USAGE_ALARM`); sin control interno; no tocar No molestar.
- No declarar permisos Android sin justificación documentada (`docs/OPEN_DECISIONS.md`).
- Módulo nativo: servicio Angular + `InjectionToken` + `requireOptionalNativeModule` lazy; tipos TS = métodos Kotlin exactos.
- `minSdk` 34 (vía `expo-build-properties` en `app.json`); `targetSdk`/`compileSdk` los dicta el Expo SDK. No confundirlos.
- Módulos locales requieren development build (`npx expo run:android`); Expo Go NO sirve.

## Arquitectura
`src/app/{core/{database,native,services},features/{alarms,settings}/{domain,data,application,presentation},shared/{components,theme,utils}}`, `modules/alarm-engine` (Kotlin), `assets/{fonts,sounds,icons}`, `docs/`. Ver `docs/ARCHITECTURE.md`.

## Comandos
`npm test` · `npm run typecheck` · `npx expo-doctor` · `npx expo prebuild --platform android` · `cd android && ./gradlew :app:assembleDebug`
Entorno: `JAVA_HOME=$HOME/jdk-17`, `ANDROID_HOME=$HOME/Android/Sdk` (no exportados por defecto).

## Convenciones de código
- Comentarios y docs en ESPAÑOL (decisión del autor): explicar el porqué, no lo obvio. UI también en español (strings hardcodeados por ahora; i18n pendiente).
- Autoría y enlaces: `src/app/core/config/app-info.ts` (se muestran en Acerca de).
- Colores solo desde `shared/theme/palette.ts` vía `var(--x)`; paleta monocromática. Única excepción: la pantalla nativa de alarma (`modules/alarm-engine/.../res/values{,-night}/colors.xml`), copia manual de la paleta; y el icono de la app (`scripts/generate-icons.py`, colores del logo de Angular). Tipografía Inter local (`assets/fonts/`, declarada en `shared/theme/global-styles.ts`).
- Pantallas = rutas en `app.routes.ts` (pila nativa `@ng-native/router`). Estado con signals en `application/*.store.ts`; SQLite solo en `data/*.repository.ts`.

## UX/UI
Revisión de pantallas con el plugin `design` de Anthropic y el checklist Android en `docs/UX_REVIEW.md`. No conectar servicios externos (Figma, analítica).

## Identidad
App "AlarMap", package `com.fmoran.app` (definido por el autor), scheme `alarmap`. Política de privacidad: URL pendiente (`PRIVACY_POLICY_URL`).
