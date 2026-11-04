import { Component } from '@angular/core';

/**
 * Hoja de estilos global: tipografía Inter empaquetada localmente y color de texto por defecto.
 * Se pasa a `mount()` como `globalStyles` y a `loadFonts()` en `main.ts`.
 * Las fuentes viven en `assets/fonts/` (licencia OFL incluida en esa carpeta).
 */
@Component({
  selector: 'app-global-styles',
  template: '',
  styles: `
    @font-face {
      font-family: Inter;
      src: url('../../../../assets/fonts/Inter-Regular.ttf');
      font-weight: 400;
    }
    @font-face {
      font-family: Inter;
      src: url('../../../../assets/fonts/Inter-Medium.ttf');
      font-weight: 500;
    }
    @font-face {
      font-family: Inter;
      src: url('../../../../assets/fonts/Inter-SemiBold.ttf');
      font-weight: 600;
    }
    @font-face {
      font-family: Inter;
      src: url('../../../../assets/fonts/Inter-Bold.ttf');
      font-weight: 700;
    }
    text {
      font-family: Inter;
      color: var(--text);
    }
  `,
})
export class GlobalStyles {}
