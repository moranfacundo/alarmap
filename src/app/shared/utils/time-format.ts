import type { Alarm, AlarmType, Weekday } from '../../features/alarms/domain/alarm.model.ts';
import { parseDateKey, toDateKey } from '../../features/alarms/domain/recurrence.ts';
import type { TimeFormat } from '../../features/settings/domain/settings.model.ts';

const pad = (n: number): string => String(n).padStart(2, '0');

/** Formatea hora y minutos según la preferencia: `07:30` (24 h) o `7:30 AM` (12 h). */
export function formatTime(hour: number, minute: number, format: TimeFormat): string {
  if (format === 24) return `${pad(hour)}:${pad(minute)}`;
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${pad(minute)} ${hour < 12 ? 'AM' : 'PM'}`;
}

/** Nombres de los días, índice 0 = lunes. */
export const WEEKDAY_SHORT: readonly string[] = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const WEEKDAY_INITIAL: readonly string[] = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
export const WEEKDAY_LONG: readonly string[] = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
];

export const MONTH_NAMES: readonly string[] = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export const ALARM_TYPE_LABEL: Record<AlarmType, string> = {
  once: 'Una vez',
  weekly: 'Semanal',
  monthly: 'Mensual',
};

/** Resume los días elegidos: "Todos los días", "Lun a Vie" o "Lun, Mié". */
export function describeWeekdays(days: readonly Weekday[]): string {
  if (days.length === 7) return 'Todos los días';
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 5 && sorted.every((d, i) => d === i)) return 'Lun a Vie';
  return sorted.map((d) => WEEKDAY_SHORT[d]).join(', ');
}

/** Fecha corta legible: "Hoy", "Mañana" o "3 nov 2026". */
export function describeDate(dateKey: string, today: Date = new Date()): string {
  if (dateKey === toDateKey(today)) return 'Hoy';
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  if (dateKey === toDateKey(tomorrow)) return 'Mañana';
  const p = parseDateKey(dateKey);
  if (!p) return dateKey;
  return `${p.day} ${MONTH_NAMES[p.month].slice(0, 3)} ${p.year}`;
}

/** Texto de repetición que se muestra en la tarjeta de la lista. */
export function describeRepeat(alarm: Alarm, today: Date = new Date()): string {
  switch (alarm.type) {
    case 'once':
      return alarm.date ? describeDate(alarm.date, today) : 'Una vez';
    case 'weekly':
      return describeWeekdays(alarm.weekdays);
    case 'monthly':
      return `Día ${alarm.dayOfMonth} de cada mes`;
  }
}
