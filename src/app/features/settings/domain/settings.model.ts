/** Formato horario: 12 o 24 horas. */
export type TimeFormat = 12 | 24;

/** Preferencias globales. SQLite (tabla `settings`, fila única) es la fuente de verdad. */
export interface Settings {
  readonly vibration: boolean;
  /** Duración del posponer, en minutos. */
  readonly snoozeMinutes: number;
  readonly defaultToneId: string;
  readonly timeFormat: TimeFormat;
}

/**
 * Límites del posponer.
 * PROVISIONAL: el rango definitivo está pendiente (docs/OPEN_DECISIONS.md #3).
 */
export const SNOOZE_MIN_MINUTES = 1;
export const SNOOZE_MAX_MINUTES = 30;

export const DEFAULT_SETTINGS: Settings = {
  vibration: true,
  snoozeMinutes: 5,
  defaultToneId: 'default',
  timeFormat: 24,
};

/** Ajusta el valor al rango permitido. */
export function clampSnooze(minutes: number): number {
  return Math.min(SNOOZE_MAX_MINUTES, Math.max(SNOOZE_MIN_MINUTES, Math.round(minutes)));
}
