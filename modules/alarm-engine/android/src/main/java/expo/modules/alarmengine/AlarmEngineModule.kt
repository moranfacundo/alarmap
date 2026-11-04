package expo.modules.alarmengine

import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Etapa 1: solo superficie de validación del enlace Angular <-> Kotlin.
// El motor real (AlarmManager, receivers, audio, vibración, recuperación tras reinicio)
// está diseñado en docs/ANDROID_ALARM_ENGINE.md y aún no se implementa.
class AlarmEngineModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AlarmEngine")

    // Nivel de API de Android del dispositivo.
    Constant("SDK_INT") {
      Build.VERSION.SDK_INT
    }

    // Prueba síncrona: devuelve "pong".
    Function("ping") {
      "pong"
    }

    // Prueba asíncrona: devuelve "pong:<valor>".
    AsyncFunction("pingAsync") { value: String ->
      "pong:$value"
    }
  }
}
