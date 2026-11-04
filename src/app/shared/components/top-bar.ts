import { Component, input, output } from '@angular/core';
import { Pressable, Text, View } from '@ng-native/components';

/** Barra superior propia: título, botón de volver opcional y acciones proyectadas a la derecha. */
@Component({
  selector: 'app-top-bar',
  imports: [Pressable, Text, View],
  template: `
    <view class="bar">
      @if (showBack()) {
        <pressable
          class="back"
          accessibilityRole="button"
          accessibilityLabel="Volver"
          [hitSlop]="8"
          (press)="backPress.emit()"
        >
          <text class="back-icon">←</text>
        </pressable>
      }
      <text class="title" [numberOfLines]="1" accessibilityRole="header">{{ title() }}</text>
      <view class="actions"><ng-content /></view>
    </view>
  `,
  styles: `
    .bar {
      flex-direction: row;
      align-items: center;
      gap: 8px;
      min-height: 56px;
      padding: 0 16px;
    }
    .back {
      width: 40px;
      height: 40px;
      align-items: center;
      justify-content: center;
      margin-left: -8px;
    }
    .back-icon {
      font-size: 24px;
    }
    .title {
      flex: 1;
      font-size: 22px;
      font-weight: 600;
    }
    .actions {
      flex-direction: row;
      align-items: center;
      gap: 8px;
    }
  `,
})
export class TopBar {
  readonly title = input.required<string>();
  /** Muestra la flecha de volver. */
  readonly showBack = input(false);
  /** Se emite al tocar la flecha de volver. */
  readonly backPress = output<void>();
}
