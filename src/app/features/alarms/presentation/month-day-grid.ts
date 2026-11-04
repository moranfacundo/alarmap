import { Component, model } from '@angular/core';
import { Pressable, Text, View } from '@ng-native/components';

/** Cuadrícula para elegir el día del mes (1 a 31) en alarmas mensuales. */
@Component({
  selector: 'app-month-day-grid',
  imports: [Pressable, Text, View],
  template: `
    <view class="grid">
      @for (d of days; track d) {
        <pressable
          class="cell"
          [class.sel]="day() === d"
          accessibilityRole="button"
          [accessibilityLabel]="'Día ' + d"
          [accessibilityState]="{ selected: day() === d }"
          (press)="day.set(d)"
        >
          <text class="cell-text" [class.sel-text]="day() === d">{{ d }}</text>
        </pressable>
      }
    </view>
  `,
  styles: `
    .grid {
      flex-direction: row;
      flex-wrap: wrap;
    }
    .cell {
      width: 14.2857%;
      height: 44px;
      align-items: center;
      justify-content: center;
      border-radius: 22px;
    }
    .cell.sel {
      background-color: var(--accent);
    }
    .cell-text {
      font-size: 15px;
    }
    .cell-text.sel-text {
      color: var(--on-accent);
      font-weight: 600;
    }
  `,
})
export class MonthDayGrid {
  /** Día elegido (1-31) o `null`. Enlace bidireccional. */
  readonly day = model<number | null>(null);

  protected readonly days = Array.from({ length: 31 }, (_, i) => i + 1);
}
