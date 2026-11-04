import { Injectable } from '@angular/core';
import { appDb } from '../../../core/database/app-database.ts';
import { DEFAULT_SETTINGS, type Settings, type TimeFormat } from '../domain/settings.model.ts';

/** Fila de la tabla `settings` (siempre `id = 1`). */
interface SettingsRow {
  vibration: number;
  snooze_minutes: number;
  default_tone_id: string;
  time_format: number;
}

/** Acceso a las preferencias globales guardadas en SQLite. */
@Injectable({ providedIn: 'root' })
export class SettingsRepository {
  async get(): Promise<Settings> {
    const db = await appDb.ready();
    const row = await db.getFirstAsync<SettingsRow>('SELECT * FROM settings WHERE id = 1');
    if (!row) return DEFAULT_SETTINGS;
    return {
      vibration: row.vibration === 1,
      snoozeMinutes: row.snooze_minutes,
      defaultToneId: row.default_tone_id,
      timeFormat: (row.time_format === 12 ? 12 : 24) as TimeFormat,
    };
  }

  /** Guarda todas las preferencias (la fila única siempre existe por la migración v1). */
  async save(settings: Settings): Promise<void> {
    const db = await appDb.ready();
    await db.runAsync(
      `UPDATE settings
         SET vibration = ?, snooze_minutes = ?, default_tone_id = ?, time_format = ?
       WHERE id = 1`,
      [
        settings.vibration ? 1 : 0,
        settings.snoozeMinutes,
        settings.defaultToneId,
        settings.timeFormat,
      ],
    );
  }
}
