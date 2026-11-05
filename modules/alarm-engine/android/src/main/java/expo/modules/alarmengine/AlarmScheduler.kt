package expo.modules.alarmengine

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import java.time.ZonedDateTime

/**
 * Programa en AlarmManager SOLO la próxima ocurrencia de cada alarma (nunca repetitivas del
 * sistema); al disparar, el receiver calcula y programa la siguiente. Usa setAlarmClock: máxima
 * prioridad, exenta de Doze, y el sistema muestra la próxima alarma en la barra de estado.
 * Identidad estable por alarma: Intent.data = alarmap://alarm/<id> (+ acción, para separar snooze).
 */
object AlarmScheduler {
  const val ACTION_FIRE = "expo.modules.alarmengine.FIRE"
  const val ACTION_SNOOZE_FIRE = "expo.modules.alarmengine.SNOOZE_FIRE"
  const val EXTRA_ALARM_ID = "alarmId"

  private fun alarmManager(context: Context) =
    context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

  private fun firePending(context: Context, action: String, id: String, create: Boolean): PendingIntent? {
    val intent = Intent(context, AlarmReceiver::class.java)
      .setAction(action)
      .setData(Uri.parse("alarmap://alarm/$id"))
      .putExtra(EXTRA_ALARM_ID, id)
    val flags = PendingIntent.FLAG_IMMUTABLE or
      (if (create) PendingIntent.FLAG_UPDATE_CURRENT else PendingIntent.FLAG_NO_CREATE)
    return PendingIntent.getBroadcast(context, 0, intent, flags)
  }

  /** Al tocar el indicador de próxima alarma del sistema se abre la app. */
  private fun showIntent(context: Context): PendingIntent? =
    context.packageManager.getLaunchIntentForPackage(context.packageName)?.let {
      PendingIntent.getActivity(context, 0, it, PendingIntent.FLAG_IMMUTABLE)
    }

  private fun set(context: Context, action: String, id: String, triggerAtMillis: Long) {
    val pi = firePending(context, action, id, create = true)!!
    try {
      alarmManager(context).setAlarmClock(AlarmManager.AlarmClockInfo(triggerAtMillis, showIntent(context)), pi)
    } catch (e: SecurityException) {
      // Sin permiso de alarmas exactas: no se puede garantizar la hora. Se registra, no se oculta.
      android.util.Log.e("AlarmScheduler", "Alarmas exactas no permitidas", e)
    }
  }

  private fun cancel(context: Context, action: String, id: String) {
    firePending(context, action, id, create = false)?.let {
      alarmManager(context).cancel(it)
      it.cancel()
    }
  }

  fun canScheduleExact(context: Context): Boolean = alarmManager(context).canScheduleExactAlarms()

  /** Programa (o cancela) la ocurrencia normal de [alarm] según su estado actual. */
  fun scheduleBase(context: Context, alarm: AlarmData) {
    val next = if (alarm.enabled) AlarmRecurrence.next(alarm.schedule, ZonedDateTime.now()) else null
    if (next == null) cancel(context, ACTION_FIRE, alarm.id)
    else set(context, ACTION_FIRE, alarm.id, next.toInstant().toEpochMilli())
  }

  fun scheduleSnooze(context: Context, id: String, triggerAtMillis: Long) {
    SnoozeStore.put(context, id, triggerAtMillis)
    set(context, ACTION_SNOOZE_FIRE, id, triggerAtMillis)
  }

  fun cancelSnooze(context: Context, id: String) {
    SnoozeStore.remove(context, id)
    cancel(context, ACTION_SNOOZE_FIRE, id)
  }

  /**
   * Reacción a una acción del usuario sobre una alarma (guardar, activar/desactivar, borrar):
   * recalcula su programación y descarta cualquier posposición pendiente.
   */
  fun reschedule(context: Context, id: String) {
    cancelSnooze(context, id)
    val alarm = AlarmDb.get(context, id)
    if (alarm == null) cancel(context, ACTION_FIRE, id) else scheduleBase(context, alarm)
  }

  /**
   * Recalcula todas las alarmas (arranque de la app, reinicio, cambio de hora o zona).
   * Las posposiciones NO se cancelan aquí: una alarma "once" ya disparada está desactivada y aun
   * así su posposición debe sonar. Las posposiciones vencidas se descartan.
   */
  fun rescheduleAll(context: Context) {
    val now = System.currentTimeMillis()
    for (alarm in AlarmDb.listAll(context)) {
      if (alarm.enabled && alarm.schedule.type == "once" &&
        AlarmRecurrence.next(alarm.schedule, ZonedDateTime.now()) == null
      ) {
        AlarmDb.disableOnce(context, alarm.id) // la fecha ya pasó (p. ej. teléfono apagado)
        continue
      }
      scheduleBase(context, alarm)
    }
    for ((id, at) in SnoozeStore.all(context)) {
      if (at > now) set(context, ACTION_SNOOZE_FIRE, id, at) else cancelSnooze(context, id)
    }
  }
}
