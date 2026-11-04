# Motor de alarmas Android (DISEÑO — no implementado)

## Estado
Módulo `modules/alarm-engine` (`expo.modules.alarmengine`, Android-only). Hoy solo `SDK_INT`, `ping`, `pingAsync`.

## Clases previstas (`expo/modules/alarmengine/`)
AlarmEngineModule · AlarmScheduler · AlarmReceiver · AlarmRingingService (solo si se justifica) · AlarmAudioManager · AlarmVibrationManager · AlarmNotificationManager · BootReceiver · AlarmStorage.

## Scheduling
`AlarmManager`; evaluar `setAlarmClock()` como principal. `RTC_WAKEUP` cuando corresponda. `PendingIntent` explícitos, estables, por ID. Programar SOLO la siguiente ocurrencia y reprogramar al disparar. Sin alarmas repetitivas del sistema. Snooze = ejecución temporal separada de la programación original.

## Recuperación
Boot + cambios de hora/fecha/zona → recalcular. SQLite fuente de verdad; `AlarmStorage` = snapshot de proyección (pendiente: cómo se actualiza/reconcilia; ver OPEN_DECISIONS #12).

## Audio / vibración
Audio separado del scheduling. `AudioAttributes.USAGE_ALARM`, audio focus, liberar recursos, llamadas. No asumir bypass de DND; no pedir acceso a DND. Vibración vía `Vibrator`/`VibratorManager` según preferencia global.

## Permisos (nada declarado aún)
Evaluar: USE_EXACT_ALARM vs SCHEDULE_EXACT_ALARM (no ambos por defecto), USE_FULL_SCREEN_INTENT, POST_NOTIFICATIONS (Android 13+), RECEIVE_BOOT_COMPLETED, FGS (tipo mediaPlayback) solo si hace falta. Fallback por notificación siempre.

## Contrato TS (no definitivo)
```ts
export interface AlarmEngine {
  schedule(alarm: NativeAlarm): Promise<void>;
  cancel(alarmId: string): Promise<void>;
  rescheduleAll(): Promise<void>;
  getExactAlarmPermissionStatus(): Promise<boolean>;
  stopRinging(alarmId: string): Promise<void>;
  snooze(alarmId: string, minutes: number): Promise<void>;
}
```
Mantener sincronizado con Kotlin. Según el permiso de alarmas exactas elegido, puede corresponder abrir la configuración especial de Android en lugar de pedir un permiso en tiempo de ejecución.

## Limitaciones conocidas
- Force stop puede detener alarmas/broadcasts hasta reabrir la app.
- Restricciones de batería por fabricante.
- Full-screen sujeto a permisos/políticas.
- Notificaciones requieren autorización.
- Llamadas, audio focus y DND dependen del sistema.
La app debe manejar estos casos sin fallar en silencio.
