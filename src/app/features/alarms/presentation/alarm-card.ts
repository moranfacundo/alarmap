import { Component, computed, inject, input, output } from '@angular/core';
import { Pressable, Switch, Text, View } from '@ng-native/components';
import type { TimeFormat } from '../../settings/domain/settings.model.ts';
import type { Alarm } from '../domain/alarm.model.ts';
import { ThemeService } from '../../../shared/theme/theme.service.ts';
import { ALARM_TYPE_LABEL, describeRepeat, formatTime } from '../../../shared/utils/time-format.ts';

/** Tarjeta de una alarma en la lista: hora, etiqueta, repetición, tipo y switch de activación. */
@Component({
  selector: 'app-alarm-card',
  imports: [Pressable, Switch, Text, View],
  template: `
    <view class="card">
      <!-- La zona de edición y el switch son hermanos: si el switch estuviera dentro del pressable,
           la tarjeta capturaría el toque y el switch nunca cambiaría. -->
      <pressable
        class="info"
        accessibilityRole="button"
        [accessibilityLabel]="summary()"
        [style.opacity]="alarm().enabled ? 1 : 0.55"
        (press)="open.emit()"
      >
        <text class="time">{{ time() }}</text>
        @if (alarm().label) {
          <text class="label" [numberOfLines]="1">{{ alarm().label }}</text>
        }
        <text class="meta">{{ typeLabel() }} · {{ repeat() }}</text>
      </pressable>
      <view class="toggle">
        <switch
          [checked]="alarm().enabled"
          [trackColor]="theme.switchTrack()"
          [thumbColor]="theme.colors().switchThumb"
          accessibilityLabel="Activar alarma"
          (checkedChange)="toggle.emit($event)"
        />
      </view>
    </view>
  `,
  styles: `
    .card {
      flex-direction: row;
      align-items: center;
      border-radius: 24px;
      background-color: var(--surface);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
    }
    .info {
      flex: 1;
      gap: 2px;
      padding: 16px 8px 16px 20px;
    }
    .toggle {
      padding: 16px 20px 16px 8px;
    }
    .time {
      font-size: 36px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }
    .label {
      font-size: 16px;
      font-weight: 500;
    }
    .meta {
      font-size: 13px;
      color: var(--text-muted);
    }
  `,
})
export class AlarmCard {
  protected readonly theme = inject(ThemeService);

  readonly alarm = input.required<Alarm>();
  readonly timeFormat = input<TimeFormat>(24);
  /** Se emite al tocar la tarjeta (editar). */
  readonly open = output<void>();
  /** Se emite con el nuevo estado al cambiar el switch. */
  readonly toggle = output<boolean>();

  protected readonly time = computed(() =>
    formatTime(this.alarm().hour, this.alarm().minute, this.timeFormat()),
  );
  protected readonly typeLabel = computed(() => ALARM_TYPE_LABEL[this.alarm().type]);
  protected readonly repeat = computed(() => describeRepeat(this.alarm()));
  /** Texto leído por lectores de pantalla. */
  protected readonly summary = computed(() => {
    const a = this.alarm();
    return `${this.time()}, ${a.label || 'sin etiqueta'}, ${this.typeLabel()}, ${this.repeat()}, ${a.enabled ? 'activada' : 'desactivada'}`;
  });
}
