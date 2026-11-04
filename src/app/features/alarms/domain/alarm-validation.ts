import type { AlarmDraft } from './alarm.model.ts';
import { nextOccurrence, parseDateKey } from './recurrence.ts';

/** Validaciones de negocio del formulario. Devuelve los mensajes de error (vacío = válido). */
export function validateDraft(draft: AlarmDraft, now: Date = new Date()): string[] {
  const errors: string[] = [];

  if (!Number.isInteger(draft.hour) || draft.hour < 0 || draft.hour > 23) {
    errors.push('La hora no es válida.');
  }
  if (!Number.isInteger(draft.minute) || draft.minute < 0 || draft.minute > 59) {
    errors.push('Los minutos no son válidos.');
  }

  if (draft.category === 'routine') {
    if (draft.type !== 'weekly') errors.push('Una rutina debe repetirse por días de la semana.');
    if (draft.tags.length === 0) errors.push('Agrega al menos un medicamento o tarea.');
  }

  switch (draft.type) {
    case 'once':
      if (!draft.date || !parseDateKey(draft.date)) {
        errors.push('Elige una fecha.');
      } else if (nextOccurrence(draft, now) === null) {
        errors.push('La fecha y hora elegidas ya pasaron.');
      }
      break;
    case 'weekly':
      if (draft.weekdays.length === 0) errors.push('Elige al menos un día de la semana.');
      break;
    case 'monthly':
      if (draft.dayOfMonth === null || draft.dayOfMonth < 1 || draft.dayOfMonth > 31) {
        errors.push('Elige un día del mes entre 1 y 31.');
      }
      break;
  }

  return errors;
}
