package expo.modules.alarmengine

import android.Manifest
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Puente Angular <-> motor de alarmas. El motor lee SQLite directamente, así que aquí solo se
 * avisa qué alarma cambió (el id), se consultan permisos y se previsualizan tonos.
 * Mantener sincronizado con NativeAlarmEngine en src/app/core/native/alarm-engine.service.ts.
 */
class AlarmEngineModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("Contexto de React no disponible")

  private var preview: AlarmAudioManager? = null

  override fun definition() = ModuleDefinition {
    Name("AlarmEngine")

    Constant("SDK_INT") { Build.VERSION.SDK_INT }

    Events("onAlarmsChanged")

    OnStartObserving("onAlarmsChanged") {
      AlarmEvents.onAlarmsChanged = { sendEvent("onAlarmsChanged", mapOf<String, Any>()) }
    }
    OnStopObserving("onAlarmsChanged") { AlarmEvents.onAlarmsChanged = null }

    // Recalcula y programa una alarma tras guardarla, activarla/desactivarla o borrarla.
    AsyncFunction("reschedule") { alarmId: String -> AlarmScheduler.reschedule(context, alarmId) }

    AsyncFunction("rescheduleAll") { AlarmScheduler.rescheduleAll(context) }

    AsyncFunction("getPermissionStatus") {
      val nm = context.getSystemService(NotificationManager::class.java)
      mapOf(
        "notifications" to nm.areNotificationsEnabled(),
        "fullScreen" to nm.canUseFullScreenIntent(),
        "exactAlarm" to AlarmScheduler.canScheduleExact(context),
      )
    }

    // Diálogo del sistema (Android 13+). Resuelve con el estado que informa Expo; releer con getPermissionStatus.
    AsyncFunction("requestNotificationPermission") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(
        appContext.permissions, promise, Manifest.permission.POST_NOTIFICATIONS,
      )
    }

    // Ajustes de notificaciones de la app: salida cuando el diálogo del sistema ya no se muestra
    // (el usuario lo rechazó dos veces) y la única forma de activarlas es a mano.
    AsyncFunction("openNotificationSettings") {
      context.startActivity(
        Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
          .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
      )
    }

    // Android 14: el usuario puede revocar la pantalla completa; se gestiona en ajustes especiales.
    AsyncFunction("openFullScreenIntentSettings") {
      context.startActivity(
        Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:${context.packageName}"))
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
      )
    }

    // Previsualización de un tono (una pasada, mismo canal USAGE_ALARM que al sonar).
    AsyncFunction("previewTone") { toneId: String ->
      preview?.stop()
      preview = AlarmAudioManager(context).also { it.play(toneId, loop = false) }
    }

    AsyncFunction("stopPreview") {
      preview?.stop()
      preview = null
    }

    OnDestroy {
      preview?.stop()
      AlarmEvents.onAlarmsChanged = null
    }
  }
}
