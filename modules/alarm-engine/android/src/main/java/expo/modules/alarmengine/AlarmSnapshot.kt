package expo.modules.alarmengine

import android.content.Context
import android.util.AtomicFile
import org.json.JSONArray
import org.json.JSONObject
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

/** Contenido completo de un snapshot. */
data class SnapshotState(val alarms: List<AlarmData>, val settings: EngineSettings)

/**
 * Proyección de recuperación del estado de la app: JS (única dueña de SQLite) envía el JSON
 * completo tras cada cambio (ver src/app/core/native/engine-snapshot.ts) y aquí se guarda en un
 * archivo propio. Kotlin NO abre alarms.db: dos copias de SQLite en un proceso (la de expo-sqlite
 * y la del sistema) no comparten locks/WAL y se pisan. Lo único que el motor cambia por su cuenta
 * es desactivar alarmas "once" ya disparadas: queda en el snapshot y en una lista de pendientes
 * que JS consume (`takeDisabled`) para reflejarlo en SQLite.
 * Vive en filesDir (almacenamiento cifrado): disponible tras el primer desbloqueo, como antes.
 */
object AlarmSnapshot {
  val DEFAULT_SETTINGS = EngineSettings(vibration = true, snoozeMinutes = 5, timeFormat = 24)
  private const val PREFS = "alarmap_disabled_once"
  private const val KEY_IDS = "ids"

  private fun file(context: Context) = AtomicFile(File(context.filesDir, "alarm-engine/snapshot.json"))
  private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  /** Parseo puro (testeable en JVM). Lanza si el JSON no es válido. */
  fun parse(json: String): SnapshotState {
    val root = JSONObject(json)
    val s = root.getJSONObject("settings")
    val settings = EngineSettings(s.getBoolean("vibration"), s.getInt("snoozeMinutes"), s.getInt("timeFormat"))
    val arr = root.getJSONArray("alarms")
    val alarms = (0 until arr.length()).map { i ->
      val o = arr.getJSONObject(i)
      AlarmData(
        id = o.getString("id"),
        label = o.optString("label", ""),
        enabled = o.getBoolean("enabled"),
        schedule = Schedule(
          type = o.getString("type"),
          hour = o.getInt("hour"),
          minute = o.getInt("minute"),
          date = if (o.isNull("date")) null else o.getString("date"),
          weekdaysMask = o.optInt("weekdaysMask", 0),
          dayOfMonth = if (o.isNull("dayOfMonth")) null else o.getInt("dayOfMonth"),
        ),
        toneId = o.getString("toneId"),
        tags = parseTags(o.optJSONArray("tags")),
      )
    }
    return SnapshotState(alarms, settings)
  }

  private fun parseTags(arr: JSONArray?): List<String> =
    if (arr == null) emptyList() else (0 until arr.length()).mapNotNull { arr.optString(it).takeIf { s -> s.isNotBlank() } }

  private fun serialize(state: SnapshotState): String = JSONObject().apply {
    put("version", 1)
    put("settings", JSONObject().apply {
      put("vibration", state.settings.vibration)
      put("snoozeMinutes", state.settings.snoozeMinutes)
      put("timeFormat", state.settings.timeFormat)
    })
    put("alarms", JSONArray().apply {
      state.alarms.forEach { a ->
        put(JSONObject().apply {
          put("id", a.id)
          put("label", a.label)
          put("enabled", a.enabled)
          put("type", a.schedule.type)
          put("hour", a.schedule.hour)
          put("minute", a.schedule.minute)
          put("date", a.schedule.date ?: JSONObject.NULL)
          put("weekdaysMask", a.schedule.weekdaysMask)
          put("dayOfMonth", a.schedule.dayOfMonth ?: JSONObject.NULL)
          put("toneId", a.toneId)
          put("tags", JSONArray(a.tags))
        })
      }
    })
  }.toString()

  @Synchronized
  private fun write(context: Context, state: SnapshotState) {
    val f = file(context)
    f.baseFile.parentFile?.mkdirs()
    val out = f.startWrite()
    try {
      out.write(serialize(state).toByteArray())
      f.finishWrite(out)
    } catch (e: Exception) {
      f.failWrite(out)
      throw e
    }
  }

  /** Sin archivo (la app nunca sincronizó) o ilegible: estado vacío; el error se registra. */
  @Synchronized
  private fun read(context: Context): SnapshotState {
    val f = file(context)
    if (!f.baseFile.exists()) return SnapshotState(emptyList(), DEFAULT_SETTINGS)
    return try {
      parse(String(f.readFully()))
    } catch (e: Exception) {
      android.util.Log.e("AlarmSnapshot", "Snapshot ilegible", e)
      SnapshotState(emptyList(), DEFAULT_SETTINGS)
    }
  }

  /**
   * Reemplaza el snapshot por el que envió JS (lanza si es inválido: la promesa se rechaza).
   * Una "once" ya desactivada por el motor y aún no consumida por JS sigue desactivada.
   */
  @Synchronized
  fun replace(context: Context, json: String) {
    val parsed = parse(json)
    val pending = pendingIds(context)
    val fixed = parsed.copy(alarms = parsed.alarms.map {
      if (it.id in pending && it.schedule.type == "once") it.copy(enabled = false) else it
    })
    write(context, fixed)
  }

  fun listAll(context: Context): List<AlarmData> = read(context).alarms
  fun get(context: Context, id: String): AlarmData? = read(context).alarms.firstOrNull { it.id == id }
  fun settings(context: Context): EngineSettings = read(context).settings

  /** Única escritura propia: una "once" que ya sonó (o venció) queda desactivada y pendiente para JS. */
  @Synchronized
  fun disableOnce(context: Context, id: String) {
    val state = read(context)
    val target = state.alarms.firstOrNull { it.id == id && it.schedule.type == "once" } ?: return
    write(context, state.copy(alarms = state.alarms.map { if (it === target) it.copy(enabled = false) else it }))
    prefs(context).edit().putStringSet(KEY_IDS, pendingIds(context) + id).commit()
  }

  /** Ids desactivados por el motor desde la última vez; se consumen. */
  @Synchronized
  fun takeDisabled(context: Context): List<String> {
    val ids = pendingIds(context).toList()
    prefs(context).edit().remove(KEY_IDS).commit()
    return ids
  }

  private fun pendingIds(context: Context): Set<String> =
    prefs(context).getStringSet(KEY_IDS, emptySet())?.toSet() ?: emptySet()
}
