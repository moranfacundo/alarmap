package expo.modules.alarmengine

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager

/**
 * Reproducción nativa del tono. USAGE_ALARM: el volumen es el de alarma del sistema (sin control
 * interno) y no se toca No molestar. Libera siempre el reproductor y el foco de audio.
 */
class AlarmAudioManager(private val context: Context) {
  private val audio = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
  private var player: MediaPlayer? = null
  private var focus: AudioFocusRequest? = null

  private val attributes = AudioAttributes.Builder()
    .setUsage(AudioAttributes.USAGE_ALARM)
    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
    .build()

  /** [loop] = true para la alarma sonando; false para la previsualización (una pasada). */
  fun play(toneId: String, loop: Boolean) {
    stop()
    focus = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
      .setAudioAttributes(attributes)
      .build()
      .also { audio.requestAudioFocus(it) }

    val mp = MediaPlayer()
    try {
      mp.setAudioAttributes(attributes)
      val res = AlarmTones.resource(toneId)
      if (res != null) {
        context.resources.openRawResourceFd(res).use { mp.setDataSource(it.fileDescriptor, it.startOffset, it.length) }
      } else {
        // Tono desconocido: tono de alarma del sistema.
        mp.setDataSource(context, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM))
      }
      mp.isLooping = loop
      if (!loop) mp.setOnCompletionListener { stop() }
      mp.prepare()
      mp.start()
      player = mp
    } catch (e: Exception) {
      android.util.Log.e("AlarmAudio", "No se pudo reproducir el tono", e)
      mp.release()
      stop()
    }
  }

  fun stop() {
    player?.let {
      runCatching { it.stop() }
      it.release()
    }
    player = null
    focus?.let { audio.abandonAudioFocusRequest(it) }
    focus = null
  }
}
