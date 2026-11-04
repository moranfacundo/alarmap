# Arquitectura

## Stack (instalado)
Angular Native 0.22.0 (template oficial), Expo ~58.0.16, React Native 0.88.x (solo runtime Fabric), Angular ^22, TypeScript ~6.0, Vitest, `@ng-native/expo` 0.22.0, `expo-sqlite` ~58.0.15, `expo-build-properties` ~58.0.12.

## Capas
```
src/app/
  core/database   -> appDb = database('alarms.db', migrations)  (@ng-native/expo/database)
  core/native     -> AlarmEngineService (puente Kotlin)
  core/services   -> servicios transversales
  features/{alarms,settings}/
    domain        -> entidades, reglas puras (recurrencia, orden)
    data          -> repositorios SQLite
    application   -> casos de uso / servicios Angular (signals)
    presentation  -> componentes
  shared/{components,theme,utils}
modules/alarm-engine/   -> Expo local module (Kotlin, Android-only)
```
Regla de dependencia: presentation → application → domain ← data. Domain sin dependencias de framework.

## Responsabilidades
- TS: UI, formularios, validación, gestión de alarmas/ajustes, SQLite, coordinación.
- Kotlin: scheduling, ejecución, audio, vibración, notificaciones, lock screen, boot recovery, permisos Android.
- Prohibido `setTimeout`/`setInterval` para alarmas.

## SQLite
`appDb.ready()` abre y migra (`PRAGMA user_version`, una transacción por migración). `onOpen`: `foreign_keys=ON`, WAL. Migración v1 provisional: tablas `alarm`, `settings` (fila única id=1). SQLite = fuente de verdad.

## Puente nativo
`AlarmEngineService.NATIVE` (`InjectionToken`) carga `requireOptionalNativeModule('AlarmEngine')` con `require('expo')` diferido (evita importar RN en Node). `null` si el módulo no existe → degradación. Tests inyectan fake. Interfaz `NativeAlarmEngine` refleja Kotlin a mano (sin verificación automática).
Superficie actual: `SDK_INT`, `ping()`, `pingAsync(v)`.

## Android
`minSdk` 34 via `expo-build-properties` (`android.minSdkVersion=34` en gradle.properties generado). `targetSdk`/`compileSdk` = defaults del SDK. `android/` es generado (prebuild, ignorado por git).

## Navegación y pantallas
`provideNativeRouter(routes, withComponentInputBinding())` en `main.ts`; raíz `<native-stack-outlet>`. Rutas: `''` lista, `alarm/new` y `alarm/:id` editor (el `id` llega como input), `settings`, `about`. Barra superior propia (`shared/components/top-bar.ts`).

## Tema y tipografía
`App` publica la paleta activa (`palette.ts`, según `ColorScheme`) como variables CSS; los estilos usan `var(--bg)` etc. Inter se declara con `@font-face` en `shared/theme/global-styles.ts` y se registra con `loadFonts()` antes de montar.

## Flujo de datos
presentation → `AlarmStore`/`SettingsStore` (signals) → `*.repository.ts` → `appDb` (SQLite). Las pantallas no tocan SQLite directamente.

## Pruebas
Vitest en Node con repositorios en memoria (`app.test.ts`); dominio puro en `recurrence.test.ts`; puente nativo con módulo falso.
