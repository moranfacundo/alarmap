package expo.modules.alarmengine

import java.time.LocalDate
import java.time.YearMonth
import java.time.ZoneId
import java.time.ZonedDateTime

/** Los campos de una alarma que intervienen en el cálculo de la próxima ocurrencia. */
data class Schedule(
  val type: String, // "once" | "weekly" | "monthly"
  val hour: Int,
  val minute: Int,
  val date: String?, // YYYY-MM-DD local, solo "once"
  val weekdaysMask: Int, // bit 0 = lunes ... bit 6 = domingo
  val dayOfMonth: Int?,
)

/**
 * Réplica en Kotlin de `nextOccurrence` (src/app/features/alarms/domain/recurrence.ts).
 * Mantener ambos en sincronía: mismos casos en recurrence.test.ts y AlarmRecurrenceTest.kt.
 *
 * Devuelve la próxima ejecución ESTRICTAMENTE posterior a [from], o null si ya no ocurrirá.
 * Regla mensual: si el mes no tiene el día elegido (31 en febrero) se OMITE ese mes.
 */
object AlarmRecurrence {
  fun next(s: Schedule, from: ZonedDateTime): ZonedDateTime? {
    val zone: ZoneId = from.zone
    fun at(d: LocalDate): ZonedDateTime = d.atTime(s.hour, s.minute).atZone(zone)

    return when (s.type) {
      "once" -> {
        val d = s.date?.let { runCatching { LocalDate.parse(it) }.getOrNull() } ?: return null
        at(d).takeIf { it.isAfter(from) }
      }
      "weekly" -> {
        if (s.weekdaysMask and 0x7F == 0) return null
        val today = from.toLocalDate()
        // Hoy y los 7 días siguientes: siempre hay coincidencia si hay días elegidos.
        (0L..7L).asSequence()
          .map { today.plusDays(it) }
          .filter { s.weekdaysMask and (1 shl (it.dayOfWeek.value - 1)) != 0 }
          .map { at(it) }
          .firstOrNull { it.isAfter(from) }
      }
      "monthly" -> {
        val dom = s.dayOfMonth?.takeIf { it in 1..31 } ?: return null
        val start = YearMonth.from(from)
        // 24 meses cubren cualquier combinación (el peor caso, día 30 o 31, necesita 2).
        (0L until 24L).asSequence()
          .map { start.plusMonths(it) }
          .filter { dom <= it.lengthOfMonth() }
          .map { at(it.atDay(dom)) }
          .firstOrNull { it.isAfter(from) }
      }
      else -> null
    }
  }
}
