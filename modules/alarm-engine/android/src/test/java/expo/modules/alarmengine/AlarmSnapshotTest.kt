package expo.modules.alarmengine

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Test

class AlarmSnapshotTest {
  private val json = """{"version":1,"settings":{"vibration":false,"snoozeMinutes":7,"timeFormat":12},
    "alarms":[{"id":"a1","label":"x","enabled":true,"type":"weekly","hour":7,"minute":30,"date":null,
    "weekdaysMask":5,"dayOfMonth":null,"toneId":"default","tags":["x1 Aciclovir"," "]}]}"""

  @Test fun parseaAlarmasYAjustes() {
    val s = AlarmSnapshot.parse(json)
    assertEquals(EngineSettings(false, 7, 12), s.settings)
    val a = s.alarms.single()
    assertEquals(Schedule("weekly", 7, 30, null, 5, null), a.schedule)
    assertEquals(listOf("x1 Aciclovir"), a.tags)
    assertNull(a.schedule.date)
  }

  @Test fun jsonInvalidoLanza() {
    assertThrows(Exception::class.java) { AlarmSnapshot.parse("{}") }
  }
}
