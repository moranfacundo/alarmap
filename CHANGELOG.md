# Registro de cambios

Todos los cambios relevantes de Alarmap se documentan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versionado [SemVer](https://semver.org/lang/es/).

## [Sin publicar]

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
