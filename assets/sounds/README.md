# Sonidos

Los tonos NO se empaquetan desde aquí: los reproduce Kotlin y viven en
`modules/alarm-engine/android/src/main/res/raw/tone_<id>.wav` (ids: default, gentle, digital, bell, pulse).
Se regeneran con `python3 scripts/generate-tones.py` (obra propia, sin licencias de terceros).

Para reemplazar uno por un archivo externo: usar solo CC0 (Freesound con filtro CC0, Kenney, OpenGameArt),
convertirlo a WAV/OGG mono, conservar el nombre `tone_<id>` y registrar la fuente en `docs/OPEN_DECISIONS.md` #7.
Evitar CC-BY-NC y licencias con atribución obligatoria.
