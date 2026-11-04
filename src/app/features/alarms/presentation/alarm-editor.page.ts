import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Dialogs } from '@ng-native/device';
import {
  KeyboardAvoidingView,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from '@ng-native/components';
import { NativeNavigation } from '@ng-native/router';
import { TopBar } from '../../../shared/components/top-bar.ts';
import { ThemeService } from '../../../shared/theme/theme.service.ts';
import { ALARM_TYPE_LABEL } from '../../../shared/utils/time-format.ts';
import { SettingsStore } from '../../settings/application/settings.store.ts';
import { TonePicker } from '../../settings/presentation/tone-picker.ts';
import { AlarmStore } from '../application/alarm.store.ts';
import { validateDraft } from '../domain/alarm-validation.ts';
import type { AlarmDraft, AlarmType, Weekday } from '../domain/alarm.model.ts';
import { toDateKey } from '../domain/recurrence.ts';
import { CalendarPicker } from './calendar-picker.ts';
import { MonthDayGrid } from './month-day-grid.ts';
import { TimeDial } from './time-dial.ts';
import { WeekdayPicker } from './weekday-picker.ts';

/** Descripción corta de cada tipo, mostrada en el paso 1. */
const TYPE_HELP: Record<AlarmType, string> = {
  once: 'Suena una sola vez en la fecha elegida.',
  weekly: 'Se repite los días de la semana que elijas.',
  monthly: 'Se repite un día fijo de cada mes.',
};

/**
 * Creación y edición de alarmas en pantalla completa.
 * Crear = 2 pasos (1: tipo, 2: formulario del tipo). Editar = directo al formulario.
 */
@Component({
  selector: 'app-alarm-editor-page',
  imports: [
    CalendarPicker,
    KeyboardAvoidingView,
    MonthDayGrid,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TimeDial,
    TonePicker,
    TopBar,
    View,
    WeekdayPicker,
  ],
  template: `
    <safe-area-view class="screen">
      <app-top-bar [title]="title()" [showBack]="true" (backPress)="back()" />

      @if (step() === 'type') {
        <view class="types">
          <text class="step-hint">¿Qué tipo de alarma quieres crear?</text>
          @for (t of types; track t) {
            <pressable
              class="type-card"
              accessibilityRole="button"
              [accessibilityLabel]="typeLabels[t] + '. ' + typeHelp[t]"
              (press)="chooseType(t)"
            >
              <text class="type-title">{{ typeLabels[t] }}</text>
              <text class="type-help">{{ typeHelp[t] }}</text>
            </pressable>
          }
        </view>
      } @else {
        <!-- Reduce el área visible cuando aparece el teclado para que no tape el campo que se escribe. -->
        <keyboard-avoiding-view class="avoiding">
          <scroll-view class="scroll" keyboardShouldPersistTaps="handled">
            <view class="form">
              <app-time-dial
                [(hour)]="hour"
                [(minute)]="minute"
                [format]="settings.settings().timeFormat"
              />

              <view class="field">
                <text class="field-title">Etiqueta</text>
                <text-input
                  class="input"
                  placeholder="Descripción (opcional)"
                  [placeholderTextColor]="theme.colors().textMuted"
                  [maxLength]="60"
                  [(value)]="label"
                />
              </view>

              @switch (type()) {
                @case ('once') {
                  <view class="field">
                    <text class="field-title">Fecha</text>
                    <app-calendar-picker [(date)]="date" />
                  </view>
                }
                @case ('weekly') {
                  <view class="field">
                    <text class="field-title">Repetir</text>
                    <app-weekday-picker [(selected)]="weekdays" />
                  </view>
                }
                @case ('monthly') {
                  <view class="field">
                    <text class="field-title">Día del mes</text>
                    <app-month-day-grid [(day)]="dayOfMonth" />
                    <text class="note"
                      >Si un mes no tiene ese día (por ejemplo, el 31 en febrero), la alarma se
                      omite ese mes y suena en el siguiente que sí lo tenga.</text
                    >
                  </view>
                }
              }

              <view class="field">
                <text class="field-title">Tono</text>
                <app-tone-picker [(toneId)]="toneId" />
              </view>

              @for (error of errors(); track error) {
                <text class="error" accessibilityRole="alert">{{ error }}</text>
              }

              <view class="buttons">
                <pressable
                  class="primary"
                  accessibilityRole="button"
                  [disabled]="saving()"
                  (press)="save()"
                >
                  <text class="primary-text">Guardar</text>
                </pressable>
                @if (isEditing()) {
                  <pressable class="secondary" accessibilityRole="button" (press)="remove()">
                    <text class="secondary-text">Eliminar alarma</text>
                  </pressable>
                }
              </view>
            </view>
          </scroll-view>
        </keyboard-avoiding-view>
      }
    </safe-area-view>
  `,
  styles: `
    :host {
      flex: 1;
    }
    .screen {
      flex: 1;
      background-color: var(--bg);
    }
    .types {
      gap: 12px;
      padding: 8px 16px;
    }
    .step-hint {
      font-size: 15px;
      color: var(--text-muted);
      margin-bottom: 4px;
    }
    .type-card {
      gap: 4px;
      padding: 20px;
      border-radius: 24px;
      background-color: var(--surface);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
    }
    .type-title {
      font-size: 20px;
      font-weight: 600;
    }
    .type-help {
      font-size: 14px;
      color: var(--text-muted);
    }
    .avoiding {
      flex: 1;
    }
    .scroll {
      flex: 1;
    }
    .form {
      gap: 24px;
      padding: 8px 16px 32px;
    }
    .field {
      gap: 10px;
    }
    .field-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-muted);
    }
    .input {
      min-height: 48px;
      padding: 0 16px;
      border-radius: 16px;
      background-color: var(--surface);
      color: var(--text);
      font-family: Inter;
      font-size: 16px;
    }
    .note {
      font-size: 13px;
      color: var(--text-muted);
    }
    .error {
      font-size: 14px;
      font-weight: 500;
    }
    .buttons {
      gap: 12px;
    }
    .primary {
      min-height: 52px;
      align-items: center;
      justify-content: center;
      border-radius: 26px;
      background-color: var(--accent);
    }
    .primary-text {
      font-size: 16px;
      font-weight: 600;
      color: var(--on-accent);
    }
    .secondary {
      min-height: 52px;
      align-items: center;
      justify-content: center;
      border-radius: 26px;
      border-width: 1px;
      border-color: var(--border);
    }
    .secondary-text {
      font-size: 16px;
      font-weight: 500;
    }
  `,
})
export class AlarmEditorPage implements OnInit {
  /** Id de la alarma a editar; viene de la ruta `/alarm/:id`. Sin valor = alarma nueva. */
  readonly id = input<string>();

  protected readonly store = inject(AlarmStore);
  protected readonly settings = inject(SettingsStore);
  protected readonly theme = inject(ThemeService);
  private readonly nav = inject(NativeNavigation);
  private readonly dialogs = inject(Dialogs);

  protected readonly types: readonly AlarmType[] = ['once', 'weekly', 'monthly'];
  protected readonly typeLabels = ALARM_TYPE_LABEL;
  protected readonly typeHelp = TYPE_HELP;

  /** Paso actual: 1 = elegir tipo, 2 = formulario. */
  protected readonly step = signal<'type' | 'form'>('type');
  protected readonly isEditing = computed(() => this.id() !== undefined);

  // Campos del formulario.
  protected readonly type = signal<AlarmType>('once');
  protected readonly hour = signal(7);
  protected readonly minute = signal(0);
  protected readonly label = signal('');
  protected readonly date = signal<string | null>(null);
  protected readonly weekdays = signal<readonly Weekday[]>([]);
  protected readonly dayOfMonth = signal<number | null>(null);
  protected readonly toneId = signal('default');

  protected readonly errors = signal<string[]>([]);
  protected readonly saving = signal(false);

  protected readonly title = computed(() => {
    if (this.isEditing()) return 'Editar alarma';
    return this.step() === 'type' ? 'Nueva alarma' : `Alarma · ${ALARM_TYPE_LABEL[this.type()]}`;
  });

  /** Datos del formulario, normalizados: solo se guarda el campo que corresponde al tipo. */
  private readonly draft = computed<AlarmDraft>(() => {
    const type = this.type();
    return {
      label: this.label().trim(),
      enabled: true, // al guardar, la alarma queda activa (comportamiento habitual al crear o editar)
      type,
      hour: this.hour(),
      minute: this.minute(),
      date: type === 'once' ? this.date() : null,
      weekdays: type === 'weekly' ? this.weekdays() : [],
      dayOfMonth: type === 'monthly' ? this.dayOfMonth() : null,
      toneId: this.toneId(),
    };
  });

  ngOnInit(): void {
    const id = this.id();
    if (id === undefined) {
      this.applyDefaults();
      return;
    }
    const alarm = this.store.byId(id);
    if (!alarm) {
      this.back(); // la alarma ya no existe
      return;
    }
    this.type.set(alarm.type);
    this.hour.set(alarm.hour);
    this.minute.set(alarm.minute);
    this.label.set(alarm.label);
    this.date.set(alarm.date);
    this.weekdays.set(alarm.weekdays);
    this.dayOfMonth.set(alarm.dayOfMonth);
    this.toneId.set(alarm.toneId);
    this.step.set('form');
  }

  /** Valores iniciales de una alarma nueva: próxima hora en punto, tono por defecto y fecha válida. */
  private applyDefaults(): void {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1);
    this.hour.set(next.getHours());
    this.minute.set(0);
    this.date.set(toDateKey(next)); // si la próxima hora cae mañana, la fecha ya es la de mañana
    this.dayOfMonth.set(now.getDate());
    this.toneId.set(this.settings.settings().defaultToneId);
  }

  protected chooseType(type: AlarmType): void {
    this.type.set(type);
    this.errors.set([]);
    this.step.set('form');
  }

  /** Volver: del formulario al paso de tipo (si es nueva) o salir de la pantalla. */
  protected back(): void {
    if (this.step() === 'form' && !this.isEditing()) {
      this.step.set('type');
      return;
    }
    this.nav.back();
  }

  protected async save(): Promise<void> {
    const errors = validateDraft(this.draft());
    this.errors.set(errors);
    if (errors.length > 0) return;

    this.saving.set(true);
    try {
      await this.store.save(this.draft(), this.id());
      this.nav.back();
    } catch (e) {
      this.errors.set([`No se pudo guardar la alarma: ${String(e)}`]);
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(): Promise<void> {
    const id = this.id();
    if (id === undefined) return;
    const ok = await this.dialogs.confirm('Eliminar alarma', {
      message: 'Esta acción no se puede deshacer.',
      confirm: 'Eliminar',
      cancel: 'Cancelar',
      destructive: true,
    });
    if (!ok) return;
    try {
      await this.store.remove(id);
      this.nav.back();
    } catch (e) {
      this.errors.set([`No se pudo eliminar la alarma: ${String(e)}`]);
    }
  }
}
