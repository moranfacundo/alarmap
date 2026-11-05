# Decisiones abiertas

| # | Tema | Estado / recomendación inicial |
|---|------|-------------------------------|
| 1 | Repetición del sonido | Implementado: continuo hasta Detener/Posponer, con tope de seguridad de 10 min (luego notificación "Alarma perdida"). Confirmar tope. |
| 2 | Audio vs llamadas / No molestar | `USAGE_ALARM` no garantiza saltar DND. Definir audio focus y comportamiento. |
| 3 | Min/max del Snooze | Default 5 min. Rango sin definir. |
| 4 | Nombre comercial | RESUELTO: "AlarMap" (nombre visible; `slug`, scheme y package no cambian). |
| 5 | Package Android | RESUELTO por el autor: `com.fmoran.app` (irreversible una vez publicado en Play). |
| 6 | Política de privacidad / URL | Sin definir. |
| 7 | Audio definitivo | RESUELTO provisional: 5 tonos propios generados por `scripts/generate-tones.py` en `res/raw` del módulo. Reemplazables por CC0 (Freesound, Kenney, OpenGameArt). |
| 8 | Inter (Regular/Medium/SemiBold/Bold) | `assets/fonts/` vacío. Empaquetar localmente. |
| 9 | Permiso alarmas exactas | RESUELTO: `USE_EXACT_ALARM` (función principal de la app = alarma; concedido automáticamente). Revisar declaración Play. |
| 10 | `USE_FULL_SCREEN_INTENT` | Declarado para mostrar la alarma sobre el bloqueo. En Android 14 el usuario puede revocarlo: la lista avisa y abre ajustes. Fallback: notificación con Posponer/Detener. Pendiente: declaración Play. |
| 11 | Foreground Service (audio) | Implementado: `AlarmRingingService`, tipo `systemExempted` (+ permiso `FOREGROUND_SERVICE_SYSTEM_EXEMPTED`) mientras suena. Pendiente: revisar declaración Play. |
| 12 | Snapshot nativo para BootReceiver | RESUELTO: no hay snapshot; Kotlin lee `filesDir/SQLite/alarms.db` directamente. Acopla Kotlin al esquema (cambiar ambos a la vez). Tras reinicio las alarmas se re-arman al primer desbloqueo (DB cifrada). |
| 13 | Esquema SQLite final | Baseline v1 provisional en `core/database/app-database.ts` (weekdays bitmask, date ISO, tone_id). Revisar con reglas de recurrencia (mes sin día 31 se omite). |
| 14 | `expo-modules-core` directo | `@ng-native/expo` lo pide como peer; `expo-doctor` advierte "no instalar directo". Instalado por seguridad; revisar cuando ng-native lo resuelva. |
| 15 | Vulnerabilidades `npm audit` | 6 moderate en deps transitivas del template; no tocadas (`--force` rompería). |
| 16 | Contrato `AlarmEngine` | El contrato inicial (ver `docs/ANDROID_ALARM_ENGINE.md`) no es definitivo (p. ej. permiso exacto puede requerir abrir ajustes, no runtime). |
| 17 | Idioma de la UI | Español hardcodeado. Si se quiere multilenguaje: Angular i18n (guía Localization de ng-native). |
| 18 | Previsualizar tono | RESUELTO: `previewTone` al elegir en el selector (una pasada, `USAGE_ALARM`). |
| 19 | Selector de hora | Tap sobre marcas (hora) + 5 min en el reloj y ajuste ±1 min. Arrastre con el dedo pendiente (requiere react-native-gesture-handler / reanimated). |
| 20 | Rango de Snooze | Provisional 1-30 min (`settings.model.ts`). Ver #3. |
| 21 | Nombre del autor | Se escribió "Facundo Morán" (el pedido decía "Moràn"); confirmar ortografía en `core/config/app-info.ts`. |
| 22 | Confirmar al descartar cambios | RESUELTO: el editor pregunta "¿Descartar cambios?" al volver con cambios sin guardar. El botón atrás físico de Android aún no se intercepta. |
| 23 | Editar una alarma desactivada | Al guardar, la alarma queda activa. Confirmar si es lo deseado. |
| 24 | Categoría medicación/rutina | Tokens libres (JSON en `alarm.tags`), se programa como `weekly`. Los tokens se muestran en la pantalla y notificación de alarma sonando. Sin dosis estructurada ni registro de tomas. |
| 25 | Contraste de componentes (WCAG 1.4.11) | RESUELTO: `--border` a 3.2:1 (claro) y 3.5:1 (oscuro) sobre `--bg`; los campos de texto tienen borde. |
| 26 | Icono | RESUELTO: reloj despertador antiguo con campanas, blanco sobre degradado del logo de Angular (`scripts/generate-icons.py`). El color vive solo en el icono; la UI sigue monocromática. |
| 27 | Texto del toast | "Alarma Guardada" (mayúscula en Guardada, tal como se pidió) vs "Alarma actualizada": inconsistente; recomendado unificar en minúscula. |

## Permisos declarados (módulo `alarm-engine`)
| Permiso | Justificación |
|---|---|
| `USE_EXACT_ALARM` | Función principal: alarmas a la hora exacta. |
| `POST_NOTIFICATIONS` | Notificación de alarma sonando (Android 13+). |
| `USE_FULL_SCREEN_INTENT` | Mostrar la alarma sobre el bloqueo. |
| `RECEIVE_BOOT_COMPLETED` | Re-armar alarmas tras reiniciar. |
| `FOREGROUND_SERVICE` + `..._SYSTEM_EXEMPTED` | Mantener audio/vibración mientras suena. |
| `VIBRATE` | Vibración de la alarma. |
