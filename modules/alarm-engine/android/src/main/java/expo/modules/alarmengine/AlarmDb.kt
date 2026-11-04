package expo.modules.alarmengine

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import org.json.JSONArray
import java.io.File

data class AlarmData(
  val id: String,
  val label: String,
  val enabled: Boolean,
  val schedule: Schedule,
  val toneId: String,
  val tags: List<String>,
)

data class EngineSettings(val vibration: Boolean, val snoozeMinutes: Int, val timeFormat: Int)

/**
 * Acceso a la MISMA base SQLite que usa la app (expo-sqlite: filesDir/SQLite/alarms.db).
 * SQLite es la fuente de verdad: aquí solo se lee, salvo desactivar alarmas "once" ya disparadas.
 * Si el archivo aún no existe (la app nunca se abrió) no hay alarmas: se devuelven valores vacíos.
 */
object AlarmDb {
  private const val DB_NAME = "alarms.db"

  private fun <T> withDb(context: Context, default: T, block: (SQLiteDatabase) -> T): T {
    val file = File(context.filesDir, "SQLite/$DB_NAME")
    if (!file.exists()) return default
    return try {
      val db = SQLiteDatabase.openDatabase(file.path, null, SQLiteDatabase.OPEN_READWRITE)
      try {
        block(db)
      } finally {
        db.close()
      }
    } catch (e: Exception) {
      android.util.Log.e("AlarmDb", "No se pudo leer la base de datos", e)
      default
    }
  }

  fun get(context: Context, id: String): AlarmData? =
    withDb(context, null) { db ->
      db.rawQuery("$SELECT WHERE id = ?", arrayOf(id)).use { c ->
        if (c.moveToFirst()) fromCursor(c) else null
      }
    }

  fun listAll(context: Context): List<AlarmData> =
    withDb(context, emptyList()) { db ->
      db.rawQuery(SELECT, null).use { c ->
        buildList { while (c.moveToNext()) add(fromCursor(c)) }
      }
    }

  fun settings(context: Context): EngineSettings {
    val defaults = EngineSettings(vibration = true, snoozeMinutes = 5, timeFormat = 24)
    return withDb(context, defaults) { db ->
      db.rawQuery(
        "SELECT vibration, snooze_minutes, time_format FROM settings WHERE id = 1", null,
      ).use { c ->
        if (c.moveToFirst()) EngineSettings(c.getInt(0) == 1, c.getInt(1), c.getInt(2)) else defaults
      }
    }
  }

  /** Única escritura: una alarma "once" que ya sonó queda desactivada. */
  fun disableOnce(context: Context, id: String) {
    withDb(context, Unit) { db ->
      db.execSQL(
        "UPDATE alarm SET enabled = 0, updated_at = ? WHERE id = ? AND type = 'once'",
        arrayOf(System.currentTimeMillis(), id),
      )
    }
  }

  private const val SELECT =
    "SELECT id, label, enabled, type, hour, minute, date, weekdays, day_of_month, tone_id, tags FROM alarm"

  private fun fromCursor(c: android.database.Cursor) = AlarmData(
    id = c.getString(0),
    label = c.getString(1),
    enabled = c.getInt(2) == 1,
    schedule = Schedule(
      type = c.getString(3),
      hour = c.getInt(4),
      minute = c.getInt(5),
      date = if (c.isNull(6)) null else c.getString(6),
      weekdaysMask = if (c.isNull(7)) 0 else c.getInt(7),
      dayOfMonth = if (c.isNull(8)) null else c.getInt(8),
    ),
    toneId = c.getString(9),
    tags = parseTags(c.getString(10)),
  )

  private fun parseTags(raw: String?): List<String> = try {
    val arr = JSONArray(raw ?: "[]")
    (0 until arr.length()).mapNotNull { arr.optString(it).takeIf { s -> s.isNotBlank() } }
  } catch (e: Exception) {
    emptyList()
  }
}
