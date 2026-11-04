import { Component, inject } from '@angular/core';
import { SafeAreaProvider, View } from '@ng-native/components';
import { StatusBar } from '@ng-native/device';
import { NativeStackOutlet } from '@ng-native/router';
import { ThemeService } from './shared/theme/theme.service.ts';

/**
 * Componente raíz. Publica la paleta activa como variables CSS (`--bg`, `--text`...) para que
 * todos los componentes la lean con `var()`. Cambia sola al cambiar el tema del sistema.
 */
@Component({
  selector: 'app-root',
  imports: [NativeStackOutlet, SafeAreaProvider, View],
  template: `
    <safe-area-provider>
      <view
        class="root"
        [style.--bg]="c().bg"
        [style.--surface]="c().surface"
        [style.--surface-alt]="c().surfaceAlt"
        [style.--text]="c().text"
        [style.--text-muted]="c().textMuted"
        [style.--border]="c().border"
        [style.--accent]="c().accent"
        [style.--on-accent]="c().onAccent"
      >
        <native-stack-outlet />
      </view>
    </safe-area-provider>
  `,
  styles: `
    :host {
      flex: 1;
    }
    .root {
      flex: 1;
      background-color: var(--bg);
    }
  `,
})
export class App {
  protected readonly c = inject(ThemeService).colors;

  constructor() {
    // Iconos de la barra de estado oscuros en modo claro y claros en modo oscuro.
    inject(StatusBar).set({ style: 'auto' });
  }
}
