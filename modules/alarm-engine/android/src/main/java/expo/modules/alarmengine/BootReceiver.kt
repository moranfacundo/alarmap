package expo.modules.alarmengine

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Reinicio, actualización de la app, cambio de hora o de zona: AlarmManager pierde (o desfasa)
 * lo programado, así que se recalcula todo desde el snapshot (ver AlarmSnapshot).
 * No se escucha LOCKED_BOOT_COMPLETED: el snapshot vive en almacenamiento cifrado hasta el primer
 * desbloqueo, por lo que las alarmas se re-arman cuando el usuario desbloquea tras reiniciar.
 */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val pending = goAsync()
    Thread {
      try {
        AlarmScheduler.rescheduleAll(context)
      } finally {
        pending.finish()
      }
    }.start()
  }
}
