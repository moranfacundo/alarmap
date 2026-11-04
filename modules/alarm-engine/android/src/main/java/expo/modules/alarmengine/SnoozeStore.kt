package expo.modules.alarmengine

import android.content.Context

/**
 * Posposiciones pendientes {alarmId -> epoch ms}. Es una ejecución temporal APARTE de la
 * programación normal de la alarma: sobrevive a reinicios y no toca SQLite.
 */
object SnoozeStore {
  private fun prefs(context: Context) =
    context.getSharedPreferences("alarmap_snooze", Context.MODE_PRIVATE)

  fun put(context: Context, id: String, triggerAt: Long) {
    prefs(context).edit().putLong(id, triggerAt).apply()
  }

  fun remove(context: Context, id: String) {
    prefs(context).edit().remove(id).apply()
  }

  fun all(context: Context): Map<String, Long> =
    prefs(context).all.mapNotNull { (k, v) -> (v as? Long)?.let { k to it } }.toMap()
}
