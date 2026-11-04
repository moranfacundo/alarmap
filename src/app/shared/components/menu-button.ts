import { Component, input, output } from '@angular/core';
import { Pressable, View } from '@ng-native/components';

/**
 * Botón de menú (hamburguesa). Las tres barras son vistas y no un glifo de texto, para no depender
 * de que la tipografía incluya el símbolo. Área táctil de 48 dp.
 */
@Component({
  selector: 'app-menu-button',
  imports: [Pressable, View],
  template: `
    <pressable
      class="button"
      accessibilityRole="button"
      accessibilityLabel="Menú"
      [accessibilityState]="{ expanded: expanded() }"
      (press)="press.emit()"
    >
      <view class="bar" />
      <view class="bar" />
      <view class="bar" />
    </pressable>
  `,
  styles: `
    .button {
      width: 48px;
      height: 48px;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }
    .bar {
      width: 22px;
      height: 2px;
      border-radius: 1px;
      background-color: var(--text);
    }
  `,
})
export class MenuButton {
  /** El menú asociado está abierto (se anuncia a TalkBack). */
  readonly expanded = input(false);
  readonly press = output<void>();
}
