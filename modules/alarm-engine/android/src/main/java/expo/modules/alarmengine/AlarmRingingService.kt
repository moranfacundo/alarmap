package expo.modules.alarmengine

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import java.time.LocalTime
import java.time.format.DateTimeFormatter

/**
 * Servicio en primer plano mientras una alarma suena: audio + vibración + notificación con
 * pantalla completa (AlarmActivity) y acciones Posponer/Detener. Una alarma a la vez: si llega
 * otra, reemplaza a la actual. Tipo systemExempted (permitido a apps con USE_EXACT_ALARM).
 */
class AlarmRingingService : Service() {
  companion object {
    private const val ACTION_START = "expo.modules.alarmengine.START"
    const val ACTION_STOP = "expo.modules.alarmengine.STOP"
    const val ACTION_SNOOZE = "expo.modules.alarmengine.SNOOZE"
    /** Se emite al terminar de sonar, para que AlarmActivity se cierre. */
    const val ACTION_RINGING_ENDED = "expo.modules.alarmengine.RINGING_ENDED"
    const val CHANNEL_ID = "alarmap_alarms"
    private const val RINGING_ID = 1001
    private const val MISSED_ID = 1002
    /** Tope de seguridad: si nadie atiende, deja de sonar (decisión de repetición: OPEN #1). */
    private const val MAX_RING_MS = 10 * 60 * 1000L

    fun start(context: Context, alarmId: String) {
      context.startForegroundService(
        Intent(context, AlarmRingingService::class.java)
          .setAction(ACTION_START)
          .putExtra(AlarmScheduler.EXTRA_ALARM_ID, alarmId),
      )
    }

    fun actionIntent(context: Context, action: String): Intent =
      Intent(context, AlarmRingingService::class.java).setAction(action)
  }

  private val handler = Handler(Looper.getMainLooper())
  private var audio: AlarmAudioManager? = null
  private var vibration: AlarmVibrationManager? = null
  private var currentId: String? = null
  private var currentLabel: String = ""
  private val timeout = Runnable { onTimeout() }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_STOP -> finish(notifyEnded = true)
      ACTION_SNOOZE -> snooze()
      else -> ring(intent?.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID))
    }
    return START_NOT_STICKY
  }

  private fun ring(id: String?) {
    if (id == null) {
      // Siempre hay que llamar a startForeground tras startForegroundService.
      startForeground(RINGING_ID, baseNotification("Alarma", "").build(), ServiceInfo.FOREGROUND_SERVICE_TYPE_SYSTEM_EXEMPTED)
      finish(notifyEnded = false)
      return
    }
    val alarm = AlarmDb.get(this, id)
    val settings = AlarmDb.settings(this)
    currentId = id
    currentLabel = alarm?.label.orEmpty()

    createChannel()
    val text = buildString {
      append(formatNow(settings.timeFormat))
      if (!alarm?.tags.isNullOrEmpty()) append(" · ").append(alarm!!.tags.joinToString(", "))
    }
    val notification = baseNotification(currentLabel.ifBlank { "Alarma" }, text)
      .setFullScreenIntent(activityIntent(id), true)
      .addAction(0, "Posponer", servicePending(ACTION_SNOOZE))
      .addAction(0, "Detener", servicePending(ACTION_STOP))
      .build()
    startForeground(RINGING_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SYSTEM_EXEMPTED)

    audio?.stop()
    vibration?.stop()
    audio = AlarmAudioManager(this).also { it.play(alarm?.toneId ?: "default", loop = true) }
    vibration = if (settings.vibration) AlarmVibrationManager(this).also { it.start() } else null

    handler.removeCallbacks(timeout)
    handler.postDelayed(timeout, MAX_RING_MS)
  }

  private fun snooze() {
    val id = currentId
    if (id != null) {
      val minutes = AlarmDb.settings(this).snoozeMinutes
      AlarmScheduler.scheduleSnooze(this, id, System.currentTimeMillis() + minutes * 60_000L)
    }
    finish(notifyEnded = true)
  }

  private fun onTimeout() {
    val label = currentLabel.ifBlank { "Alarma" }
    finish(notifyEnded = true)
    getSystemService(NotificationManager::class.java).notify(
      MISSED_ID,
      baseNotification("Alarma perdida", label).setOngoing(false).setAutoCancel(true).build(),
    )
  }

  private fun finish(notifyEnded: Boolean) {
    handler.removeCallbacks(timeout)
    audio?.stop()
    vibration?.stop()
    audio = null
    vibration = null
    currentId = null
    if (notifyEnded) sendBroadcast(Intent(ACTION_RINGING_ENDED).setPackage(packageName))
    stopForeground(STOP_FOREGROUND_REMOVE)
    stopSelf()
  }

  override fun onDestroy() {
    handler.removeCallbacks(timeout)
    audio?.stop()
    vibration?.stop()
    super.onDestroy()
  }

  private fun createChannel() {
    val channel = NotificationChannel(CHANNEL_ID, "Alarmas", NotificationManager.IMPORTANCE_HIGH).apply {
      description = "Alarmas sonando"
      setSound(null, null) // el audio lo reproduce AlarmAudioManager con USAGE_ALARM
      enableVibration(false) // la vibración la controla el ajuste global
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
    }
    getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
  }

  private fun baseNotification(title: String, text: String): Notification.Builder {
    createChannel()
    return Notification.Builder(this, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setContentTitle(title)
      .setContentText(text)
      .setCategory(Notification.CATEGORY_ALARM)
      .setOngoing(true)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .also { b -> currentId?.let { b.setContentIntent(activityIntent(it)) } }
  }

  private fun activityIntent(id: String): PendingIntent = PendingIntent.getActivity(
    this, 0, AlarmActivity.intent(this, id), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
  )

  private fun servicePending(action: String): PendingIntent = PendingIntent.getService(
    this, action.hashCode(), actionIntent(this, action), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
  )

  private fun formatNow(timeFormat: Int): String =
    LocalTime.now().format(DateTimeFormatter.ofPattern(if (timeFormat == 12) "h:mm a" else "HH:mm"))
}
