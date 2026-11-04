package expo.modules.alarmengine

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.time.ZoneId
import java.time.ZonedDateTime

/** Mismos casos que src/app/features/alarms/domain/recurrence.test.ts (meses base 1 aquí). */
class AlarmRecurrenceTest {
  private val zone = ZoneId.of("America/Argentina/Buenos_Aires")
  private fun at(y: Int, m: Int, d: Int, h: Int = 0, min: Int = 0) =
    ZonedDateTime.of(y, m, d, h, min, 0, 0, zone)

  private fun monthly(dom: Int) = Schedule("monthly", 7, 30, null, 0, dom)
  private fun weekly(vararg days: Int) = Schedule("weekly", 7, 30, null, days.fold(0) { m, d -> m or (1 shl d) }, null)

  @Test fun `mensual 31 omite febrero`() =
    assertEquals(at(2027, 3, 31, 7, 30), AlarmRecurrence.next(monthly(31), at(2027, 2, 15, 12)))

  @Test fun `mensual 31 omite abril`() =
    assertEquals(at(2027, 5, 31, 7, 30), AlarmRecurrence.next(monthly(31), at(2027, 4, 1)))

  @Test fun `mensual ya paso la hora pasa al mes siguiente`() =
    assertEquals(at(2027, 2, 10, 7, 30), AlarmRecurrence.next(monthly(10), at(2027, 1, 10, 8)))

  @Test fun `semanal elige el proximo dia marcado`() =
    assertEquals(at(2027, 1, 8, 7, 30), AlarmRecurrence.next(weekly(0, 4), at(2027, 1, 5, 9)))

  @Test fun `semanal mismo dia si la hora no paso`() =
    assertEquals(at(2027, 1, 5, 7, 30), AlarmRecurrence.next(weekly(1), at(2027, 1, 5, 6)))

  @Test fun `semanal sin dias devuelve null`() =
    assertNull(AlarmRecurrence.next(weekly(), at(2027, 1, 5)))

  @Test fun `una vez fecha pasada devuelve null`() =
    assertNull(AlarmRecurrence.next(Schedule("once", 7, 30, "2020-01-01", 0, null), at(2027, 1, 1)))

  @Test fun `una vez fecha futura`() =
    assertEquals(at(2027, 2, 1, 7, 30), AlarmRecurrence.next(Schedule("once", 7, 30, "2027-02-01", 0, null), at(2027, 1, 1)))
}
