# Decisiones abiertas

| # | Tema | Estado / recomendación inicial |
|---|------|-------------------------------|
| 1 | Repetición del sonido | Recomendado: continuo hasta detener/posponer. Sin confirmar. No implementado. |
| 2 | Audio vs llamadas / No molestar | `USAGE_ALARM` no garantiza saltar DND. Definir audio focus y comportamiento. |
| 3 | Min/max del Snooze | Default 5 min. Rango sin definir. |
| 4 | Nombre comercial | RESUELTO: "Alarmap". |
| 5 | Package Android | RESUELTO por el autor: `com.fmoran.app` (irreversible una vez publicado en Play). |
| 6 | Política de privacidad / URL | Sin definir. |
| 7 | Audio definitivo | `assets/sounds/` vacío. |
| 8 | Inter (Regular/Medium/SemiBold/Bold) | `assets/fonts/` vacío. Empaquetar localmente. |
| 9 | Permiso alarmas exactas | `USE_EXACT_ALARM` (política Play restringida, función principal = alarma) vs `SCHEDULE_EXACT_ALARM` (usuario concede acceso especial). No declarado aún. |
| 10 | `USE_FULL_SCREEN_INTENT` | Evaluar elegibilidad Play; fallback notificación obligatorio. |
| 11 | Foreground Service (audio) | Solo si se justifica; revisar tipo `mediaPlayback` y permisos. |
| 12 | Snapshot nativo para BootReceiver | Cómo se proyecta/reconcilia desde SQLite sin depender de que Angular arranque. |
| 13 | Esquema SQLite final | Baseline v1 provisional en `core/database/app-database.ts` (weekdays bitmask, date ISO, tone_id). Revisar con reglas de recurrencia (mes sin día 31 se omite). |
| 14 | `expo-modules-core` directo | `@ng-native/expo` lo pide como peer; `expo-doctor` advierte "no instalar directo". Instalado por seguridad; revisar cuando ng-native lo resuelva. |
| 15 | Vulnerabilidades `npm audit` | 6 moderate en deps transitivas del template; no tocadas (`--force` rompería). |
| 16 | Contrato `AlarmEngine` | El contrato inicial (ver `docs/ANDROID_ALARM_ENGINE.md`) no es definitivo (p. ej. permiso exacto puede requerir abrir ajustes, no runtime). |
| 17 | Idioma de la UI | Español hardcodeado. Si se quiere multilenguaje: Angular i18n (guía Localization de ng-native). |
| 18 | Previsualizar tono | Requiere reproducción nativa; llega con el motor Android. El selector de tono ya existe sin audio. |
| 19 | Selector de hora | Tap sobre marcas (hora) + 5 min en el reloj y ajuste ±1 min. Arrastre con el dedo pendiente (requiere react-native-gesture-handler / reanimated). |
| 20 | Rango de Snooze | Provisional 1-30 min (`settings.model.ts`). Ver #3. |
| 21 | Nombre del autor | Se escribió "Facundo Morán" (el pedido decía "Moràn"); confirmar ortografía en `core/config/app-info.ts`. |
| 22 | Confirmar al descartar cambios | El editor no avisa al salir con cambios sin guardar. |
| 23 | Editar una alarma desactivada | Al guardar, la alarma queda activa. Confirmar si es lo deseado. |
| 24 | Categoría medicación/rutina | Tokens libres (JSON en `alarm.tags`), se programa como `weekly`. Sin dosis estructurada ni registro de tomas. Pendiente: mostrar tokens en la pantalla de alarma sonando (requiere contrato nativo). |
