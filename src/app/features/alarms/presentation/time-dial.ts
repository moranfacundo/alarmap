import { Component, computed, input, model, signal } from '@angular/core';
import { Pressable, Text, View } from '@ng-native/components';
import type { TimeFormat } from '../../settings/domain/settings.model.ts';

/** Una marca numerada del reloj circular. */
interface Mark {
  readonly value: number;
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly selected: boolean;
}

const DIAL_SIZE = 280;
const MARK_SIZE = 44;
const CENTER = DIAL_SIZE / 2;
const pad = (n: number): string => String(n).padStart(2, '0');

/**
 * Selector circular de hora inspirado en Material 3.
 * Primero se elige la hora (el reloj pasa solo a minutos) y luego los minutos.
 * Los minutos se marcan de 5 en 5 sobre el reloj y se afinan de a 1 con los botones − / +.
 * (El arrastre con el dedo queda para una iteración posterior: requiere gestos.)
 */
@Component({
  selector: 'app-time-dial',
  imports: [Pressable, Text, View],
  template: `
    <view class="wrap">
      <view class="readout">
        <pressable
          class="segment"
          [class.active]="mode() === 'hour'"
          accessibilityRole="button"
          accessibilityLabel="Elegir hora"
          (press)="mode.set('hour')"
        >
          <text class="segment-text" [class.active-text]="mode() === 'hour'">{{ hourText() }}</text>
        </pressable>
        <text class="colon">:</text>
        <pressable
          class="segment"
          [class.active]="mode() === 'minute'"
          accessibilityRole="button"
          accessibilityLabel="Elegir minutos"
          (press)="mode.set('minute')"
        >
          <text class="segment-text" [class.active-text]="mode() === 'minute'">{{
            minuteText()
          }}</text>
        </pressable>

        @if (format() === 12) {
          <view class="ampm">
            <pressable
              class="ampm-btn"
              [class.active]="!isPm()"
              accessibilityRole="button"
              (press)="setPeriod(false)"
            >
              <text class="ampm-text" [class.active-text]="!isPm()">AM</text>
            </pressable>
            <pressable
              class="ampm-btn"
              [class.active]="isPm()"
              accessibilityRole="button"
              (press)="setPeriod(true)"
            >
              <text class="ampm-text" [class.active-text]="isPm()">PM</text>
            </pressable>
          </view>
        }
      </view>

      <view class="dial">
        @for (m of marks(); track m.value) {
          <pressable
            class="mark"
            [class.sel]="m.selected"
            [style.left]="m.x"
            [style.top]="m.y"
            accessibilityRole="button"
            [accessibilityLabel]="m.text + (mode() === 'hour' ? ' horas' : ' minutos')"
            [accessibilityState]="{ selected: m.selected }"
            (press)="pick(m.value)"
          >
            <text class="mark-text" [class.sel-text]="m.selected">{{ m.text }}</text>
          </pressable>
        }
      </view>

      @if (mode() === 'minute') {
        <view class="fine">
          <pressable
            class="fine-btn"
            accessibilityRole="button"
            accessibilityLabel="Restar un minuto"
            (press)="nudge(-1)"
          >
            <text class="fine-text">− 1 min</text>
          </pressable>
          <pressable
            class="fine-btn"
            accessibilityRole="button"
            accessibilityLabel="Sumar un minuto"
            (press)="nudge(1)"
          >
            <text class="fine-text">+ 1 min</text>
          </pressable>
        </view>
      }
    </view>
  `,
  styles: `
    .wrap {
      align-items: center;
      gap: 20px;
    }
    .readout {
      flex-direction: row;
      align-items: center;
      gap: 6px;
    }
    .segment {
      min-width: 88px;
      padding: 8px 12px;
      align-items: center;
      border-radius: 16px;
      background-color: var(--surface);
    }
    .segment.active {
      background-color: var(--accent);
    }
    .segment-text {
      font-size: 48px;
      font-weight: 600;
    }
    .colon {
      font-size: 48px;
      font-weight: 600;
    }
    .active-text {
      color: var(--on-accent);
    }
    .ampm {
      margin-left: 8px;
      gap: 6px;
    }
    .ampm-btn {
      padding: 6px 10px;
      align-items: center;
      border-radius: 10px;
      border-width: 1px;
      border-color: var(--border);
    }
    .ampm-btn.active {
      background-color: var(--accent);
      border-color: var(--accent);
    }
    .ampm-text {
      font-size: 14px;
      font-weight: 600;
    }
    .dial {
      width: 280px;
      height: 280px;
      border-radius: 140px;
      background-color: var(--surface-alt);
    }
    .mark {
      position: absolute;
      width: 44px;
      height: 44px;
      align-items: center;
      justify-content: center;
      border-radius: 22px;
    }
    .mark.sel {
      background-color: var(--accent);
    }
    .mark-text {
      font-size: 16px;
      font-weight: 500;
    }
    .mark-text.sel-text {
      color: var(--on-accent);
    }
    .fine {
      flex-direction: row;
      gap: 12px;
    }
    .fine-btn {
      min-height: 44px;
      padding: 0 20px;
      align-items: center;
      justify-content: center;
      border-radius: 22px;
      border-width: 1px;
      border-color: var(--border);
    }
    .fine-text {
      font-size: 15px;
      font-weight: 500;
    }
  `,
})
export class TimeDial {
  /** Hora en formato 24 h (0-23). Enlace bidireccional. */
  readonly hour = model.required<number>();
  /** Minutos (0-59). Enlace bidireccional. */
  readonly minute = model.required<number>();
  readonly format = input<TimeFormat>(24);

  /** Qué se está eligiendo ahora: la hora o los minutos. */
  protected readonly mode = signal<'hour' | 'minute'>('hour');

  protected readonly isPm = computed(() => this.hour() >= 12);

  protected readonly hourText = computed(() => {
    if (this.format() === 24) return pad(this.hour());
    return String(this.hour() % 12 === 0 ? 12 : this.hour() % 12);
  });
  protected readonly minuteText = computed(() => pad(this.minute()));

  /** Marcas visibles según el modo y el formato horario. */
  protected readonly marks = computed<Mark[]>(() => {
    const h = this.hour();
    if (this.mode() === 'minute') {
      return this.ring(
        108,
        (i) => ({ value: i * 5, text: pad(i * 5) }),
        (v) => v === this.minute(),
      );
    }
    if (this.format() === 12) {
      return this.ring(
        108,
        (i) => {
          const label = i === 0 ? 12 : i;
          return { value: (label % 12) + (this.isPm() ? 12 : 0), text: String(label) };
        },
        (v) => v === h,
      );
    }
    // 24 h: anillo exterior 1-12 (12 arriba) e interior 13-23 y 00 (00 arriba).
    const outer = this.ring(
      108,
      (i) => ({ value: i === 0 ? 12 : i, text: String(i === 0 ? 12 : i) }),
      (v) => v === h,
    );
    const inner = this.ring(
      70,
      (i) => ({ value: i === 0 ? 0 : 12 + i, text: pad(i === 0 ? 0 : 12 + i) }),
      (v) => v === h,
    );
    return [...outer, ...inner];
  });

  /** Construye un anillo de 12 marcas a `radius` px del centro, la 0 arriba (12 en punto). */
  private ring(
    radius: number,
    describe: (index: number) => { value: number; text: string },
    isSelected: (value: number) => boolean,
  ): Mark[] {
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (i * 2 * Math.PI) / 12;
      const { value, text } = describe(i);
      return {
        value,
        text,
        x: CENTER + radius * Math.sin(angle) - MARK_SIZE / 2,
        y: CENTER - radius * Math.cos(angle) - MARK_SIZE / 2,
        selected: isSelected(value),
      };
    });
  }

  protected pick(value: number): void {
    if (this.mode() === 'hour') {
      this.hour.set(value);
      this.mode.set('minute'); // como en Material 3: tras la hora se eligen los minutos
    } else {
      this.minute.set(value);
    }
  }

  /** Suma o resta minutos sin alterar la hora (envuelve en 0-59). */
  protected nudge(delta: number): void {
    this.minute.set((this.minute() + delta + 60) % 60);
  }

  /** Cambia entre AM y PM conservando la hora del reloj de 12 h. */
  protected setPeriod(pm: boolean): void {
    this.hour.set((this.hour() % 12) + (pm ? 12 : 0));
  }
}
