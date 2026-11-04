import { Injectable } from '@angular/core';
import { appDb } from '../../../core/database/app-database.ts';
import {
  type Alarm,
  type AlarmType,
  maskToWeekdays,
  weekdaysToMask,
} from '../domain/alarm.model.ts';

/** Fila tal como está en la tabla `alarm` de SQLite. */
interface AlarmRow {
  id: string;
  label: string;
  enabled: number;
  type: AlarmType;
  hour: number;
  minute: number;
  date: string | null;
  weekdays: number | null;
  day_of_month: number | null;
  tone_id: string;
  created_at: number;
  updated_at: number;
}

function fromRow(row: AlarmRow): Alarm {
  return {
    id: row.id,
    label: row.label,
    enabled: row.enabled === 1,
    type: row.type,
    hour: row.hour,
    minute: row.minute,
    date: row.date,
    weekdays: row.weekdays === null ? [] : maskToWeekdays(row.weekdays),
    dayOfMonth: row.day_of_month,
    toneId: row.tone_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Acceso a las alarmas guardadas en SQLite. Sin lógica de negocio. */
@Injectable({ providedIn: 'root' })
export class AlarmRepository {
  async list(): Promise<Alarm[]> {
    const db = await appDb.ready();
    const rows = await db.getAllAsync<AlarmRow>('SELECT * FROM alarm');
    return rows.map(fromRow);
  }

  /** Inserta o reemplaza la alarma completa (misma `id`). */
  async upsert(alarm: Alarm): Promise<void> {
    const db = await appDb.ready();
    await db.runAsync(
      `INSERT OR REPLACE INTO alarm
        (id, label, enabled, type, hour, minute, date, weekdays, day_of_month, tone_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        alarm.id,
        alarm.label,
        alarm.enabled ? 1 : 0,
        alarm.type,
        alarm.hour,
        alarm.minute,
        alarm.date,
        alarm.type === 'weekly' ? weekdaysToMask(alarm.weekdays) : null,
        alarm.dayOfMonth,
        alarm.toneId,
        alarm.createdAt,
        alarm.updatedAt,
      ],
    );
  }

  async setEnabled(id: string, enabled: boolean, updatedAt: number): Promise<void> {
    const db = await appDb.ready();
    await db.runAsync('UPDATE alarm SET enabled = ?, updated_at = ? WHERE id = ?', [
      enabled ? 1 : 0,
      updatedAt,
      id,
    ]);
  }

  async remove(id: string): Promise<void> {
    const db = await appDb.ready();
    await db.runAsync('DELETE FROM alarm WHERE id = ?', [id]);
  }
}
