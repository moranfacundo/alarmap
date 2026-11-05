# Motor de alarmas Android

## Estado
Implementado en `modules/alarm-engine` (`expo.modules.alarmengine`, Android-only). Verificado: compila, tests unitarios de recurrencia; falta prueba en dispositivo.

## Flujo
1. Angular guarda en SQLite y llama `reschedule(id)` (`AlarmStore`). Kotlin lee la fila y programa SOLO la próxima ocurrencia con `setAlarmClock` (PendingIntent por `alarmap://alarm/<id>`).
2. Dispara `AlarmReceiver` -> arranca `AlarmRingingService` (FGS `systemExempted`): audio (`USAGE_ALARM`, bucle), vibración (si el ajuste está activo), notificación con full-screen intent a `AlarmActivity`.
3. El receiver programa la siguiente ocurrencia, o desactiva en SQLite las alarmas `once` (y emite `onAlarmsChanged`).
4. Posponer: `SnoozeStore` + `setAlarmClock` aparte (acción `SNOOZE_FIRE`); no altera la programación base. Detener: libera audio/vibración y cierra la pantalla.
5. `BootReceiver` (boot, actualización, cambio de hora/zona) -> `rescheduleAll()`.

## Clases
AlarmEngineModule (API JS) · AlarmScheduler · AlarmRecurrence (réplica de `recurrence.ts`) · AlarmSnapshot (snapshot JSON en `filesDir/alarm-engine/snapshot.json`, enviado por JS vía `sync`; Kotlin NO abre SQLite; única escritura propia: desactivar `once`, pendiente para JS vía `takeDisabledOnce`) · SnoozeStore · AlarmReceiver · BootReceiver · AlarmRingingService · AlarmActivity · AlarmAudioManager · AlarmVibrationManager · AlarmTones · AlarmEvents.

## Contrato TS
`NativeAlarmEngine` en `src/app/core/native/alarm-engine.service.ts` (mantener idéntico a `AlarmEngineModule.kt`): `reschedule`, `rescheduleAll`, `getPermissionStatus`, `requestNotificationPermission`, `openFullScreenIntentSettings`, `previewTone`, `stopPreview`, evento `onAlarmsChanged`.

## Reglas a mantener sincronizadas
- `recurrence.ts` <-> `AlarmRecurrence.kt` (mismos casos de test).
- Snapshot (`core/native/engine-snapshot.ts`) <-> `AlarmSnapshot.kt`.
- Ids de tono (`tones.ts`) <-> `AlarmTones.kt` + `res/raw`.
- Paleta (`palette.ts`) <-> `res/values{,-night}/colors.xml`.

## Límites conocidos
- Force stop detiene alarmas hasta reabrir la app; restricciones de batería por fabricante.
- Tras reiniciar, las alarmas se re-arman al primer desbloqueo (DB en almacenamiento cifrado).
- Full-screen sujeto a permiso/política (Android 14 puede revocarlo): queda la notificación con acciones.
- Notificaciones requieren autorización; llamadas, audio focus y No molestar dependen del sistema.
- Si el teléfono estuvo apagado a la hora de una alarma, no se recupera (las `once` vencidas se desactivan).
- Tope de 10 min sonando (OPEN #1).
