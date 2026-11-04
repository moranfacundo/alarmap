/** Tipos de alarma soportados. */
export type AlarmType = 'once' | 'weekly' | 'monthly';

/**
 * Categoría de la alarma, ortogonal a la recurrencia: `routine` (medicación/rutina) se programa
 * como `weekly` y solo añade tokens descriptivos.
 */
export type AlarmCategory = 'standard' | 'routine';

/** Límites de los tokens de una alarma de rutina. */
export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 30;

/**
 * Agrega un token a la lista: recorta y colapsa espacios, ignora vacíos y duplicados
 * (sin distinguir mayúsculas) y respeta los máximos. Devuelve la misma lista si no cambia.
 */
export function addTag(tags: readonly string[], raw: string): readonly string[] {
  const tag = raw.trim().replace(/\s+/g, ' ').slice(0, MAX_TAG_LENGTH).trim();
  if (!tag || tags.length >= MAX_TAGS) return tags;
  const lower = tag.toLowerCase();
  if (tags.some((t) => t.toLowerCase() === lower)) return tags;
  return [...tags, tag];
}

/** Día de la semana: 0 = lunes ... 6 = domingo. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Todos los días de la semana en orden (lunes a domingo). */
export const ALL_WEEKDAYS: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/** Alarma persistida. SQLite es la fuente de verdad. */
export interface Alarm {
  readonly id: string;
  readonly label: string;
  readonly enabled: boolean;
  readonly type: AlarmType;
  /** Hora en formato 24 h (0-23). */
  readonly hour: number;
  /** Minutos (0-59). */
  readonly minute: number;
  /** Fecha local `YYYY-MM-DD`; solo para alarmas `once`, `null` en el resto. */
  readonly date: string | null;
  /** Días de repetición; solo para `weekly`, vacío en el resto. */
  readonly weekdays: readonly Weekday[];
  /** Día del mes (1-31); solo para `monthly`, `null` en el resto. */
  readonly dayOfMonth: number | null;
  /** Identificador del tono (ver `tones.ts`). */
  readonly toneId: string;
  readonly category: AlarmCategory;
  /** Tokens (ej. "x1 Aciclovir"); solo para `routine`, vacío en el resto. */
  readonly tags: readonly string[];
  /** Epoch en milisegundos. */
  readonly createdAt: number;
  /** Epoch en milisegundos. */
  readonly updatedAt: number;
}

/** Datos editables de una alarma (lo que maneja el formulario). */
export type AlarmDraft = Omit<Alarm, 'id' | 'createdAt' | 'updatedAt'>;

/** Convierte una lista de días en máscara de bits (bit 0 = lunes). Es el formato guardado en SQLite. */
export function weekdaysToMask(days: readonly Weekday[]): number {
  return days.reduce<number>((mask, d) => mask | (1 << d), 0);
}

/** Convierte la máscara de bits guardada en SQLite a la lista de días. */
export function maskToWeekdays(mask: number): Weekday[] {
  return ALL_WEEKDAYS.filter((d) => (mask & (1 << d)) !== 0);
}
