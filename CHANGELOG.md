# Registro de cambios

Todos los cambios relevantes de AlarMap se documentan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versionado [SemVer](https://semver.org/lang/es/).

## [Sin publicar]

### Agregado
- Motor de alarmas Android (Kotlin): programación con `AlarmManager.setAlarmClock`, pantalla de alarma sobre el bloqueo, Posponer/Detener, vibración, recuperación tras reinicio y cambios de hora/zona.
- Cinco tonos propios (Clásico, Suave, Digital, Campana, Pulso) generados con `scripts/generate-tones.py`; previsualización al elegir tono.
- Aviso en la lista cuando faltan notificaciones o pantalla completa.

### Cambiado
- Nombre visible: "AlarMap". Icono nuevo (reloj despertador con campanas, colores del logo de Angular).
- Menú hamburguesa (Ajustes y Acerca de) en lugar del texto "Ajustes" en la barra principal.
- Toast al guardar ("Alarma Guardada" / "Alarma actualizada") y campos de texto con borde.
- Aviso de permisos como tarjeta tipo notificación más un diálogo (una vez por arranque); botón a los ajustes de notificaciones si el sistema ya no pregunta.
- Editor: botón Guardar y errores de validación en una barra fija (siempre visibles); confirmación al salir con cambios sin guardar. Accesibilidad: objetivos táctiles de 48 dp, etiquetas habladas en calendario y reloj, y bordes de controles a 3:1 de contraste.
- El módulo nativo lee SQLite directamente; se quitan `ping`/`pingAsync`.
- `modules/*/android/build/` deja de versionarse.

## [0.1.0] - 2026-11-04

Primera versión de desarrollo (pre-lanzamiento): interfaz y datos. **Las alarmas todavía no suenan**: el motor nativo de Android está pendiente.

### Agregado
- Proyecto base con Angular Native, Expo y SQLite; `minSdk` 34.
- Lista de alarmas ordenada por hora, con tarjetas, switch de activación y estado vacío.
- Creación en dos pasos (tipo y formulario), edición y eliminación de alarmas de tipo una vez, semanal y mensual.
- Selector circular de hora, calendario, selector de días de la semana y de día del mes.
- Regla mensual: si el mes no tiene el día elegido, se omite ese mes.
- Ajustes: vibración, duración de posponer, tono predeterminado, formato 12/24 h, acerca de, versión y privacidad.
- Tema claro y oscuro según el sistema, paleta monocromática y tipografía Inter local.
- Módulo nativo `alarm-engine` (Kotlin) con una función de prueba y su puente en Angular.
- Pantalla "Acerca de" con la autoría.

[Sin publicar]: https://github.com/moranfacundo/alarmap/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/moranfacundo/alarmap/releases/tag/v0.1.0
