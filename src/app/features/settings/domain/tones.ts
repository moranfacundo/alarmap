/** Tono empaquetado con la app. */
export interface Tone {
  readonly id: string;
  readonly name: string;
}

/**
 * Catálogo de tonos locales.
 * Los audios viven en el módulo nativo (modules/alarm-engine/.../res/raw/tone_<id>.wav, generados con
 * scripts/generate-tones.py). Mantener los ids sincronizados con AlarmTones.kt.
 * No se permite importar ni descargar tonos.
 */
export const TONES: readonly Tone[] = [
  { id: 'default', name: 'Clásico' },
  { id: 'gentle', name: 'Suave' },
  { id: 'digital', name: 'Digital' },
  { id: 'bell', name: 'Campana' },
  { id: 'pulse', name: 'Pulso' },
];

export const DEFAULT_TONE_ID = 'default';

/** Nombre legible de un tono; si el id ya no existe, cae al tono por defecto. */
export function toneName(id: string): string {
  return (TONES.find((t) => t.id === id) ?? TONES[0]).name;
}
