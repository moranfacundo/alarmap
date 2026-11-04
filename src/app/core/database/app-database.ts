import { database } from '@ng-native/expo/database';

/**
 * Base de datos local de la app. SQLite es la fuente de verdad.
 * Las migraciones se ejecutan en orden al abrir (`PRAGMA user_version`); nunca se edita una ya publicada:
 * los cambios de esquema se agregan como una migración nueva (`to: 2`, `to: 3`...).
 *
 * El esquema v1 es PROVISIONAL (ver docs/OPEN_DECISIONS.md #13).
 * Convenciones: `weekdays` es una máscara de bits (bit 0 = lunes), `date` es `YYYY-MM-DD` local,
 * los booleanos son 0/1 y las fechas de auditoría son epoch en milisegundos.
 */
export const appDb = database(
  'alarms.db',
  [
    {
      to: 1,
      up: (db) =>
        db.execAsync(`
          CREATE TABLE alarm (
            id TEXT PRIMARY KEY NOT NULL,
            label TEXT NOT NULL DEFAULT '',
            enabled INTEGER NOT NULL DEFAULT 1,
            type TEXT NOT NULL CHECK (type IN ('once','weekly','monthly')),
            hour INTEGER NOT NULL CHECK (hour BETWEEN 0 AND 23),
            minute INTEGER NOT NULL CHECK (minute BETWEEN 0 AND 59),
            date TEXT,
            weekdays INTEGER,
            day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
            tone_id TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
          -- Preferencias globales: una única fila (id = 1).
          CREATE TABLE settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            vibration INTEGER NOT NULL DEFAULT 1,
            snooze_minutes INTEGER NOT NULL DEFAULT 5,
            default_tone_id TEXT NOT NULL DEFAULT 'default',
            time_format INTEGER NOT NULL DEFAULT 24 CHECK (time_format IN (12,24))
          );
          INSERT INTO settings (id) VALUES (1);
        `),
    },
  ],
  { onOpen: (db) => db.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;') },
);
