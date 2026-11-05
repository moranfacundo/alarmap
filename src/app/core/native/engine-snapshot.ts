import { weekdaysToMask, type Alarm } from '../../features/alarms/domain/alarm.model.ts';
import type { Settings } from '../../features/settings/domain/settings.model.ts';

/**
 * Proyección de SQLite que se entrega al motor nativo (AlarmSnapshot.kt). Kotlin NO abre la base:
 * dos copias de SQLite en un mismo proceso (la de expo-sqlite y la del sistema) no comparten
 * locks ni WAL y se corrompen/ocultan datos entre sí. Cambiar este formato = cambiar AlarmSnapshot.kt.
 */
export const SNAPSHOT_VERSION = 1;

/** Serializa alarmas + ajustes al JSON que consume el motor. */
export function buildEngineSnapshot(alarms: readonly Alarm[], settings: Settings): string {
  return JSON.stringify({
    version: SNAPSHOT_VERSION,
    settings: {
      vibration: settings.vibration,
      snoozeMinutes: settings.snoozeMinutes,
      timeFormat: settings.timeFormat,
    },
    alarms: alarms.map((a) => ({
      id: a.id,
      label: a.label,
      enabled: a.enabled,
      type: a.type,
      hour: a.hour,
      minute: a.minute,
      date: a.date,
      weekdaysMask: weekdaysToMask(a.weekdays),
      dayOfMonth: a.dayOfMonth,
      toneId: a.toneId,
      tags: a.tags,
    })),
  });
}
