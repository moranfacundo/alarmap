package expo.modules.alarmengine

/** Ids de tono -> recurso en res/raw. Sincronizado con src/app/features/settings/domain/tones.ts. */
object AlarmTones {
  private val raw = mapOf(
    "default" to R.raw.tone_default,
    "gentle" to R.raw.tone_gentle,
    "digital" to R.raw.tone_digital,
    "bell" to R.raw.tone_bell,
    "pulse" to R.raw.tone_pulse,
  )

  /** Recurso del tono, o null si el id es desconocido (se usará el tono de alarma del sistema). */
  fun resource(toneId: String): Int? = raw[toneId]
}
