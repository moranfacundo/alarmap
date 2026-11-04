import { Component, OnInit, computed, input, model, signal } from '@angular/core';
import { Pressable, Text, View } from '@ng-native/components';
import { daysInMonth, toDateKey, weekdayOf } from '../domain/recurrence.ts';
import { MONTH_NAMES, WEEKDAY_INITIAL, WEEKDAY_LONG } from '../../../shared/utils/time-format.ts';

/** Celda del calendario: un día del mes o un hueco (`day = 0`). */
interface Cell {
  readonly key: string;
  readonly day: number;
  readonly dateKey: string;
  /** Fecha hablada para TalkBack (ej. "miércoles 4 de noviembre"), en vez de `2026-11-04`. */
  readonly spoken: string;
  readonly disabled: boolean;
  readonly selected: boolean;
}

/** Calendario mensual simple para elegir una fecha (alarmas de una sola vez). No permite días pasados. */
@Component({
  selector: 'app-calendar-picker',
  imports: [Pressable, Text, View],
  template: `
    <view class="calendar">
      <view class="header">
        <pressable
          class="nav"
          accessibilityRole="button"
          accessibilityLabel="Mes anterior"
          [disabled]="!canGoPrev()"
          [style.opacity]="canGoPrev() ? 1 : 0.3"
          (press)="shift(-1)"
        >
          <text class="nav-text">‹</text>
        </pressable>
        <text class="month">{{ monthTitle() }}</text>
        <pressable
          class="nav"
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
          (press)="shift(1)"
        >
          <text class="nav-text">›</text>
        </pressable>
      </view>

      <view class="row">
        @for (d of weekdayHeader; track $index) {
          <view class="cell"
            ><text class="head-text">{{ d }}</text></view
          >
        }
      </view>

      <view class="grid">
        @for (c of cells(); track c.key) {
          <view class="cell">
            @if (c.day > 0) {
              <pressable
                class="day"
                [class.sel]="c.selected"
                [disabled]="c.disabled"
                [style.opacity]="c.disabled ? 0.3 : 1"
                accessibilityRole="button"
                [accessibilityLabel]="c.spoken"
                [accessibilityState]="{ selected: c.selected, disabled: c.disabled }"
                (press)="date.set(c.dateKey)"
              >
                <text class="day-text" [class.sel-text]="c.selected">{{ c.day }}</text>
              </pressable>
            }
          </view>
        }
      </view>
    </view>
  `,
  styles: `
    .calendar {
      gap: 8px;
    }
    .header {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
    .nav {
      width: 44px;
      height: 44px;
      align-items: center;
      justify-content: center;
    }
    .nav-text {
      font-size: 28px;
    }
    .month {
      font-size: 16px;
      font-weight: 600;
    }
    .row,
    .grid {
      flex-direction: row;
      flex-wrap: wrap;
    }
    /* 7 columnas que reparten todo el ancho disponible. */
    .cell {
      width: 14.2857%;
      height: 44px;
      align-items: center;
      justify-content: center;
    }
    .head-text {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-muted);
    }
    .day {
      width: 40px;
      height: 40px;
      align-items: center;
      justify-content: center;
      border-radius: 20px;
    }
    .day.sel {
      background-color: var(--accent);
    }
    .day-text {
      font-size: 15px;
    }
    .day-text.sel-text {
      color: var(--on-accent);
      font-weight: 600;
    }
  `,
})
export class CalendarPicker implements OnInit {
  /** Fecha elegida `YYYY-MM-DD` (hora local). Enlace bidireccional. */
  readonly date = model<string | null>(null);
  /** Fecha mínima seleccionable `YYYY-MM-DD`; por defecto, hoy. */
  readonly minDate = input<string>(toDateKey(new Date()));

  protected readonly weekdayHeader = WEEKDAY_INITIAL;

  /** Mes visible: año y mes (base 0). Arranca en el mes de la fecha elegida o en el actual. */
  private readonly view = signal<{ year: number; month: number }>(
    (() => {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() };
    })(),
  );

  ngOnInit(): void {
    // Si ya hay una fecha elegida (edición), se muestra su mes. Los inputs recién existen aquí.
    const key = this.date();
    const m = key ? /^(\d{4})-(\d{2})-/.exec(key) : null;
    if (m) this.view.set({ year: Number(m[1]), month: Number(m[2]) - 1 });
  }

  protected readonly monthTitle = computed(() => {
    const { year, month } = this.view();
    const name = MONTH_NAMES[month];
    return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
  });

  protected readonly canGoPrev = computed(() => {
    const { year, month } = this.view();
    const min = this.minDate();
    return `${year}-${String(month + 1).padStart(2, '0')}` > min.slice(0, 7);
  });

  protected readonly cells = computed<Cell[]>(() => {
    const { year, month } = this.view();
    const lead = weekdayOf(new Date(year, month, 1)); // huecos antes del día 1 (semana desde lunes)
    const total = daysInMonth(year, month);
    const min = this.minDate();
    const selected = this.date();
    const out: Cell[] = [];
    for (let i = 0; i < lead; i++) {
      out.push({ key: `b${i}`, day: 0, dateKey: '', spoken: '', disabled: true, selected: false });
    }
    for (let day = 1; day <= total; day++) {
      const dateKey = toDateKey(new Date(year, month, day));
      out.push({
        key: dateKey,
        day,
        dateKey,
        spoken: `${WEEKDAY_LONG[weekdayOf(new Date(year, month, day))].toLowerCase()} ${day} de ${MONTH_NAMES[month].toLowerCase()}`,
        disabled: dateKey < min,
        selected: dateKey === selected,
      });
    }
    return out;
  });

  protected shift(delta: number): void {
    const { year, month } = this.view();
    const next = new Date(year, month + delta, 1);
    this.view.set({ year: next.getFullYear(), month: next.getMonth() });
  }
}
