import type { AlarmDraft, Weekday } from './alarm.model.ts';

/** Cantidad de días de un mes (`month` base 0, como `Date`). */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** `YYYY-MM-DD` en hora local (no UTC, para evitar corrimientos de día). */
export function toDateKey(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

/** Interpreta `YYYY-MM-DD` como fecha local; devuelve `null` si el formato no es válido. */
export function parseDateKey(key: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) - 1, day: Number(m[3]) };
}

/** Día de la semana de `date` con la convención de la app (0 = lunes ... 6 = domingo). */
export function weekdayOf(date: Date): Weekday {
  return ((date.getDay() + 6) % 7) as Weekday;
}

/**
 * Próxima ejecución estrictamente posterior a `from`, o `null` si ya no ocurrirá.
 *
 * Regla mensual: si el mes no tiene el día elegido (p. ej. 31 en febrero) se OMITE ese mes;
 * NO se reemplaza por el último día del mes.
 *
 * Es lógica pura de dominio. El motor nativo (Kotlin) deberá replicar el mismo criterio.
 */
export function nextOccurrence(
  alarm: Pick<AlarmDraft, 'type' | 'hour' | 'minute' | 'date' | 'weekdays' | 'dayOfMonth'>,
  from: Date,
): Date | null {
  const at = (y: number, m: number, d: number): Date =>
    new Date(y, m, d, alarm.hour, alarm.minute, 0, 0);

  switch (alarm.type) {
    case 'once': {
      const parts = alarm.date ? parseDateKey(alarm.date) : null;
      if (!parts) return null;
      const candidate = at(parts.year, parts.month, parts.day);
      return candidate.getTime() > from.getTime() ? candidate : null;
    }
    case 'weekly': {
      if (alarm.weekdays.length === 0) return null;
      // Se recorren hoy y los 7 días siguientes: siempre hay una coincidencia si hay días elegidos.
      for (let offset = 0; offset <= 7; offset++) {
        const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset);
        const candidate = at(day.getFullYear(), day.getMonth(), day.getDate());
        if (alarm.weekdays.includes(weekdayOf(candidate)) && candidate.getTime() > from.getTime()) {
          return candidate;
        }
      }
      return null;
    }
    case 'monthly': {
      const dom = alarm.dayOfMonth;
      if (dom === null || dom < 1 || dom > 31) return null;
      // 24 meses cubren cualquier combinación posible (el peor caso, día 30 o 31, necesita 2).
      for (let i = 0; i < 24; i++) {
        const first = new Date(from.getFullYear(), from.getMonth() + i, 1);
        const y = first.getFullYear();
        const m = first.getMonth();
        if (dom > daysInMonth(y, m)) continue; // el mes no tiene ese día: se omite
        const candidate = at(y, m, dom);
        if (candidate.getTime() > from.getTime()) return candidate;
      }
      return null;
    }
  }
}
