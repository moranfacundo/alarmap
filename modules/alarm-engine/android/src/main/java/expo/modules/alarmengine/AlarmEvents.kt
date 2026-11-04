package expo.modules.alarmengine

/**
 * Puente hacia JS: el módulo registra un listener mientras Angular escucha. Los componentes
 * nativos (receiver) avisan cuando cambian datos (una alarma "once" se desactivó al sonar).
 */
object AlarmEvents {
  @Volatile var onAlarmsChanged: (() -> Unit)? = null
}
