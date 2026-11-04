import type { Alarm } from './alarm.model.ts';

/**
 * Orden de la lista: hora ascendente, sin importar si la alarma está activa.
 * Desempate estable: fecha de creación y, si aún empatan, el id.
 */
export function compareAlarms(a: Alarm, b: Alarm): number {
  return (
    a.hour - b.hour || a.minute - b.minute || a.createdAt - b.createdAt || a.id.localeCompare(b.id)
  );
}

/** Devuelve una copia ordenada; no modifica el arreglo original. */
export function sortAlarms(alarms: readonly Alarm[]): Alarm[] {
  return [...alarms].sort(compareAlarms);
}
