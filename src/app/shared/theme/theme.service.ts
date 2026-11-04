import { Injectable, computed, inject } from '@angular/core';
import { ColorScheme } from '@ng-native/device';
import { PALETTE } from './palette.ts';

/** Expone la paleta activa. Sigue automáticamente el tema del sistema (sin selector manual). */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly scheme = inject(ColorScheme);

  readonly colors = computed(() => PALETTE[this.scheme.current()]);

  /** Colores de pista del `<switch>` nativo. */
  readonly switchTrack = computed(() => ({
    false: this.colors().switchOff,
    true: this.colors().switchOn,
  }));
}
