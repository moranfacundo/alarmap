import type { Scheme } from '@ng-native/device';

/**
 * Paleta monocromática (blanco, negro y grises) para modo claro y oscuro.
 * Es la única fuente de colores: el componente raíz los publica como variables CSS (`--bg`, `--text`...)
 * y los estilos de cada componente las leen con `var(--nombre)`.
 */
export interface Palette {
  readonly bg: string;
  readonly surface: string;
  readonly surfaceAlt: string;
  readonly text: string;
  readonly textMuted: string;
  readonly border: string;
  readonly accent: string;
  readonly onAccent: string;
  readonly switchOn: string;
  readonly switchOff: string;
  readonly switchThumb: string;
}

export const PALETTE: Record<Scheme, Palette> = {
  light: {
    bg: '#ffffff',
    surface: '#f2f2f2',
    surfaceAlt: '#e6e6e6',
    text: '#111111',
    textMuted: '#595959',
    border: '#8f8f8f', // 3.2:1 sobre --bg (WCAG 1.4.11: bordes de controles)
    accent: '#111111',
    onAccent: '#ffffff',
    switchOn: '#111111',
    switchOff: '#cfcfcf',
    switchThumb: '#ffffff',
  },
  dark: {
    bg: '#000000',
    surface: '#1c1c1c',
    surfaceAlt: '#2c2c2c',
    text: '#ffffff',
    textMuted: '#a3a3a3',
    border: '#636363', // 3.5:1 sobre --bg (WCAG 1.4.11: bordes de controles)
    accent: '#ffffff',
    onAccent: '#000000',
    switchOn: '#9a9a9a',
    switchOff: '#2c2c2c',
    switchThumb: '#ffffff',
  },
};
