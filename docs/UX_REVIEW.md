# Revisión UX/UI (skills y checklist)

## Herramienta: plugin `design` (Anthropic)
Editor: Anthropic (`anthropics/knowledge-work-plugins`, carpeta `design`). Revisado por Anthropic según el directorio de plugins (`review: done`). Funciona sin conectores: trabaja con lo que se le describe o con capturas.
No es específico de Android: aporta criterio de usabilidad, accesibilidad y redacción; la parte Android la cubre el checklist de abajo y adb.

### Instalación (la ejecuta la persona, no Claude)
```bash
claude plugin marketplace add anthropics/knowledge-work-plugins
claude plugin install design@knowledge-work-plugins
```
Reiniciar la sesión. Comprobar el origen con `/plugin` antes de aceptar. Conectores (Figma, Notion, analítica...) son opcionales: NO conectarlos; la app no tiene analítica ni red (ver CLAUDE.md).

### Comandos
| Comando | Cuándo usarlo en AlarMap |
|---|---|
| `/critique` | Pantalla nueva o rediseñada (editor, lista, ajustes, pantalla de alarma). Pasar captura + objetivo del usuario. |
| `/accessibility` | Antes de publicar y tras cambiar formularios: contraste, tamaños táctiles, TalkBack, orden de foco. |
| `/ux-copy` | Mensajes de error, estados vacíos, avisos de permisos, textos del diálogo "¿Descartar cambios?". Salida en español. |
| `/design-system` | Al tocar `shared/theme/palette.ts` o `shared/components/`. |
| `/handoff` | Especificar una pantalla antes de implementarla (estados, bordes, errores). |
| `/research-synthesis` | Resumir notas de pruebas con usuarios reales. |

### Flujo recomendado
1. Capturar la pantalla del teléfono (`adb exec-out screencap -p > captura.png`) fuera del repo.
2. Ejecutar `/critique` con la captura y la tarea ("crear una alarma y asegurarse de que quedó guardada").
3. Ejecutar `/accessibility` sobre la misma pantalla.
4. Aplicar los hallazgos, correr `npm test` y repetir la prueba en el teléfono.
5. Anotar decisiones abiertas en `docs/OPEN_DECISIONS.md`.

## Checklist Android (revisar siempre)
Basado en las pautas de Material Design 3 y Accesibilidad de Android.
- **Acción principal visible**: Guardar/confirmar nunca debe quedar bajo el pliegue ni tapado por el teclado (caso real: alarma sin guardar, OPEN #22).
- **Errores junto a la acción** que los provoca.
- **Salir con cambios** pide confirmación (el botón atrás físico aún no se intercepta).
- **Objetivos táctiles** de 48 dp mínimo.
- **Contraste** WCAG AA (4.5:1 texto, 3:1 componentes) en claro y oscuro (`palette.ts`).
- **TalkBack**: `accessibilityLabel`/`Role` en todo control; estados en `accessibilityState`.
- **Tamaño de fuente** del sistema al 130–200 %: sin textos cortados.
- **Sobre el bloqueo**: la pantalla de alarma (`AlarmActivity`) legible a distancia y con Detener/Posponer grandes.
- **Confirmación de resultado**: tras guardar, la lista debe mostrar la alarma y su próxima hora.

## Verificación en dispositivo
```bash
adb devices -l
adb -s <serial> exec-out run-as com.fmoran.app cat files/SQLite/alarms.db > /tmp/alarms.db   # estado guardado
adb -s <serial> shell dumpsys alarm | grep -A3 "com.fmoran.app}"                              # alarmas programadas
adb -s <serial> logcat -d -v time | grep -E "Background started FGS|AlarmActivity"            # disparos
```

## Auditoría del editor (2026-11-04, `/critique` + `/accessibility-review`, teléfono SM-A266M)
Evidencia: capturas por adb, árbol de accesibilidad (`uiautomator dump`) y ratios de contraste calculados desde `palette.ts`.

**Corregido**
- Guardar quedaba bajo el pliegue -> barra inferior fija con los errores de validación encima.
- Salir con cambios sin guardar -> confirmación "¿Descartar cambios?".
- Objetivos táctiles bajo 48 dp: botón Volver 40 -> 48, chips 40 -> 48, días de la semana 42 -> 46, quitar token 24x28 -> 40x40 (área táctil).
- TalkBack leía el calendario como `2026-11-04` -> ahora "miércoles 4 de noviembre"; las marcas del reloj dicen "21 horas" / "35 minutos" en vez de un número suelto.

**Pasa**: texto principal 18.9–21:1; texto atenuado 5.5–8.3:1 en ambos temas; texto sobre acento 18.9–21:1; roles y estados (`selected`, `disabled`) en todos los controles.

**Pendiente (decisión de diseño, OPEN #25)**
- ~~Borde `--border` bajo 3:1~~ RESUELTO: ahora 3.2:1 (claro) y 3.5:1 (oscuro) sobre `--bg`.
- Campos de texto: solo relleno `--surface` a 1.1–1.2:1 contra el fondo (WCAG 1.4.11 pide 3:1). Pendiente decidir si llevan borde.
- Los días pasados del calendario van a 30 % de opacidad (permitido para controles deshabilitados, pero cuesta verlos).
- Probar con TalkBack real y fuente del sistema al 200 % (no automatizado).

## Auditoría ronda 2 (2026-11-04: menú, permisos, toast, campos, icono)
`/design-critique`, `/accessibility-review` y `/ux-copy` sobre capturas y árbol de accesibilidad del SM-A266M.

**Pasa**: menú con ítems de 198×48 dp y roles `menu`/`menuitem`; botón hamburguesa 48×48 dp con etiqueta "Menú" y `expanded`; borde de campos a 3.2/3.5:1; tarjeta de permisos con texto atenuado a 5.5:1 y botón de 48 dp; icono blanco sobre degradado (≥4.2:1) dentro de la zona segura adaptativa; el toast del sistema es anunciado por TalkBack.

**Corregido tras la revisión**
- La "!" decorativa de la tarjeta la leía TalkBack -> `aria-hidden`.
- El botón "Activar" no decía qué activaba -> etiqueta "Activar notificaciones" / "Abrir ajustes de pantalla completa".
- Tarjeta y diálogo repetían un texto largo -> descripción más corta (una frase).

**Pendiente / decisión**: unificar mayúsculas del toast (OPEN #27); el menú se ancla con un desplazamiento fijo de 52 px (revisar con fuente muy grande); probar con TalkBack real.
