# Especificación funcional

Fuente: requisitos originales del autor. Este documento es la especificación vigente.

## Producto
App exclusiva de alarmas/recordatorios, Android (minSdk 34), local-only: sin backend, APIs, cuentas, nube, analytics, ads, streaming, descarga de tonos. Publicable en Google Play.

## Pantalla principal
Lista de alarmas (tarjetas), menú superior → Ajustes, FAB (+) crear, tocar tarjeta = editar, switch por tarjeta.
Tarjeta: hora, etiqueta, días de repetición, tipo, switch. Elevación moderada, bordes redondeados, sombra sutil.
Orden: hora ascendente, independiente de activa/inactiva, desempate estable.

## Crear / editar
Pantalla completa, por pasos: (1) tipo: Una vez / Semanal / Mensual; (2) formulario del tipo. Selector circular de hora (M3).
Mensual: día 1–31. Si el mes no tiene ese día, se OMITE el mes (no se usa último día). Ej.: día 31 no suena en febrero.

## Alarma sonando
Pantalla completa: hora actual, etiqueta, Posponer, Detener. Sobre bloqueo si permisos/Android lo permiten; fallback notificación con acciones.

## Sonido / vibración
Tonos locales empaquetados, varios, previsualizar, tono por defecto para nuevas. Sin importar/descargar. Reproducción nativa (no depende de Angular). Volumen = alarma del sistema. Vibración: ajuste global. Repetición del tono: pendiente.

## Snooze
Default 5 min, configurable. Detiene sonido y programa ejecución temporal; no altera la programación original (modelo distingue schedule normal de snooze).

## Apariencia
Tema del sistema (claro/oscuro), sin selector. Paleta blanco/negro/grises, contraste alto. Inter local (Regular, Medium, SemiBold, Bold).

## Ajustes
Vibración on/off · duración Snooze · tono por defecto · info app · versión · política de privacidad · formato 12/24 h. Sin volumen.

## Datos
SQLite: Alarm (id, label, enabled, type, hour, minute, date, weekdays, day_of_month, tone_id, created/updated) y Settings (vibration, snooze, default tone, time format).

## Estado de implementación
Implementado (UI + datos, sin motor Android):
- Lista ordenada, tarjetas, switch, FAB, estado vacío.
- Crear (2 pasos) / editar / eliminar; selector circular de hora, calendario (una vez), días de la semana, día del mes (1-31).
- Ajustes: vibración, snooze, tono por defecto, formato 12/24 h, acerca de, versión, privacidad.
- Persistencia SQLite, tema claro/oscuro del sistema, Inter local, autoría con enlaces.
- Regla de recurrencia pura (`nextOccurrence`) con tests, incluida la omisión de meses sin el día elegido.

NO implementado (requiere motor Kotlin): programar alarmas en el sistema, sonar, pantalla de alarma, posponer, vibración real, recuperación tras reinicio, permisos, previsualizar tonos.
