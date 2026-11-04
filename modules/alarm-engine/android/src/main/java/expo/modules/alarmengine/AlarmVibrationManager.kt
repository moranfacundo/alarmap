package expo.modules.alarmengine

import android.content.Context
import android.os.VibrationEffect
import android.os.VibratorManager

/** Vibración de la alarma sonando. Se activa según el ajuste global de vibración. */
class AlarmVibrationManager(context: Context) {
  private val vibrator =
    (context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator

  /** Patrón repetido (espera, vibra, pausa...) hasta [stop]. */
  fun start() {
    vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 600, 400), 1))
  }

  fun stop() = vibrator.cancel()
}
