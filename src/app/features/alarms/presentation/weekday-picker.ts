import { Component, model } from '@angular/core';
import { Pressable, Text, View } from '@ng-native/components';
import { ALL_WEEKDAYS, type Weekday } from '../domain/alarm.model.ts';
import { WEEKDAY_INITIAL, WEEKDAY_LONG } from '../../../shared/utils/time-format.ts';

/** Selector de días de la semana (L M X J V S D) para alarmas semanales. */
@Component({
  selector: 'app-weekday-picker',
  imports: [Pressable, Text, View],
  template: `
    <view class="row">
      @for (d of days; track d) {
        <pressable
          class="day"
          [class.sel]="isSelected(d)"
          accessibilityRole="button"
          [accessibilityLabel]="longNames[d]"
          [accessibilityState]="{ selected: isSelected(d) }"
          (press)="toggle(d)"
        >
          <text class="day-text" [class.sel-text]="isSelected(d)">{{ initials[d] }}</text>
        </pressable>
      }
    </view>
  `,
  styles: `
    .row {
      flex-direction: row;
      justify-content: space-between;
    }
    .day {
      width: 42px;
      height: 42px;
      align-items: center;
      justify-content: center;
      border-radius: 21px;
      border-width: 1px;
      border-color: var(--border);
    }
    .day.sel {
      background-color: var(--accent);
      border-color: var(--accent);
    }
    .day-text {
      font-size: 14px;
      font-weight: 600;
    }
    .day-text.sel-text {
      color: var(--on-accent);
    }
  `,
})
export class WeekdayPicker {
  /** Días elegidos. Enlace bidireccional. */
  readonly selected = model<readonly Weekday[]>([]);

  protected readonly days = ALL_WEEKDAYS;
  protected readonly initials = WEEKDAY_INITIAL;
  protected readonly longNames = WEEKDAY_LONG;

  protected isSelected(day: Weekday): boolean {
    return this.selected().includes(day);
  }

  protected toggle(day: Weekday): void {
    this.selected.update((list) =>
      list.includes(day) ? list.filter((d) => d !== day) : [...list, day],
    );
  }
}
