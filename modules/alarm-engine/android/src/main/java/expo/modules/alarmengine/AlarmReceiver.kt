package expo.modules.alarmengine

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Recibe el disparo de AlarmManager (alarma normal o posposición) y hace sonar la alarma. */
class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val id = intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID) ?: return
    val isSnooze = intent.action == AlarmScheduler.ACTION_SNOOZE_FIRE

    if (isSnooze) {
      SnoozeStore.remove(context, id)
    } else {
      // Un disparo de una alarma borrada o desactivada es obsoleto: se ignora.
      val alarm = AlarmSnapshot.get(context, id)
      if (alarm == null || !alarm.enabled) return
    }

    // Lo primero: arrancar el servicio (tiene un plazo corto para llamar a startForeground).
    AlarmRingingService.start(context, id)
    if (isSnooze) return

    // Programar la siguiente ocurrencia / desactivar "once". Nunca antes de haber hecho sonar.
    val alarm = AlarmSnapshot.get(context, id) ?: return
    if (alarm.schedule.type == "once") {
      AlarmSnapshot.disableOnce(context, id)
      AlarmEvents.onAlarmsChanged?.invoke()
    } else {
      AlarmScheduler.scheduleBase(context, alarm)
    }
  }
}
