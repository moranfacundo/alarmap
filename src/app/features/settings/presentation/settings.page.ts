import { Component, inject } from '@angular/core';
import { Dialogs } from '@ng-native/device';
import { Pressable, SafeAreaView, ScrollView, Switch, Text, View } from '@ng-native/components';
import { AppInfo } from '@ng-native/expo/app-info';
import { Browser } from '@ng-native/expo/browser';
import { NativeNavigation } from '@ng-native/router';
import { PRIVACY_POLICY_URL } from '../../../core/config/app-info.ts';
import { Chip } from '../../../shared/components/chip.ts';
import { TopBar } from '../../../shared/components/top-bar.ts';
import { ThemeService } from '../../../shared/theme/theme.service.ts';
import { SettingsStore } from '../application/settings.store.ts';
import {
  SNOOZE_MAX_MINUTES,
  SNOOZE_MIN_MINUTES,
  type TimeFormat,
} from '../domain/settings.model.ts';
import { TonePicker } from './tone-picker.ts';

/** Ajustes globales: vibración, posponer, tono por defecto, formato horario e información de la app. */
@Component({
  selector: 'app-settings-page',
  imports: [Chip, Pressable, SafeAreaView, ScrollView, Switch, Text, TonePicker, TopBar, View],
  template: `
    <safe-area-view class="screen">
      <app-top-bar title="Ajustes" [showBack]="true" (backPress)="back()" />

      <scroll-view class="scroll">
        <view class="content">
          <view class="row">
            <view class="row-text">
              <text class="row-title">Vibración</text>
              <text class="row-sub">Vibrar cuando suena una alarma</text>
            </view>
            <switch
              [checked]="store.settings().vibration"
              [trackColor]="theme.switchTrack()"
              [thumbColor]="theme.colors().switchThumb"
              accessibilityLabel="Vibración"
              (checkedChange)="store.update({ vibration: $event })"
            />
          </view>

          <view class="section">
            <text class="row-title">Posponer</text>
            <view class="stepper">
              <pressable
                class="step-btn"
                accessibilityRole="button"
                accessibilityLabel="Disminuir minutos"
                [disabled]="store.settings().snoozeMinutes <= minSnooze"
                [style.opacity]="store.settings().snoozeMinutes <= minSnooze ? 0.3 : 1"
                (press)="changeSnooze(-1)"
              >
                <text class="step-text">−</text>
              </pressable>
              <text class="step-value">{{ store.settings().snoozeMinutes }} min</text>
              <pressable
                class="step-btn"
                accessibilityRole="button"
                accessibilityLabel="Aumentar minutos"
                [disabled]="store.settings().snoozeMinutes >= maxSnooze"
                [style.opacity]="store.settings().snoozeMinutes >= maxSnooze ? 0.3 : 1"
                (press)="changeSnooze(1)"
              >
                <text class="step-text">+</text>
              </pressable>
            </view>
          </view>

          <view class="section">
            <text class="row-title">Tono predeterminado</text>
            <text class="row-sub">Se usa en las alarmas nuevas</text>
            <app-tone-picker
              [toneId]="store.settings().defaultToneId"
              (toneIdChange)="store.update({ defaultToneId: $event })"
            />
          </view>

          <view class="section">
            <text class="row-title">Formato de hora</text>
            <view class="chips">
              <app-chip
                label="24 horas"
                [selected]="store.settings().timeFormat === 24"
                (select)="setFormat(24)"
              />
              <app-chip
                label="12 horas"
                [selected]="store.settings().timeFormat === 12"
                (select)="setFormat(12)"
              />
            </view>
          </view>

          <view class="section links">
            <pressable class="link" accessibilityRole="button" (press)="about()">
              <text class="row-title">Acerca de Alarmap</text>
            </pressable>
            <pressable class="link" accessibilityRole="button" (press)="privacy()">
              <text class="row-title">Política de privacidad</text>
            </pressable>
            <view class="link">
              <text class="row-title">Versión</text>
              <text class="row-sub">{{ version }}</text>
            </view>
          </view>
        </view>
      </scroll-view>
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
    .scroll {
      flex: 1;
    }
    .content {
      gap: 24px;
      padding: 8px 16px 32px;
    }
    .row {
      flex-direction: row;
      align-items: center;
      gap: 12px;
    }
    .row-text {
      flex: 1;
      gap: 2px;
    }
    .section {
      gap: 10px;
    }
    .row-title {
      font-size: 16px;
      font-weight: 500;
    }
    .row-sub {
      font-size: 13px;
      color: var(--text-muted);
    }
    .stepper {
      flex-direction: row;
      align-items: center;
      gap: 16px;
    }
    .step-btn {
      width: 48px;
      height: 48px;
      align-items: center;
      justify-content: center;
      border-radius: 24px;
      border-width: 1px;
      border-color: var(--border);
    }
    .step-text {
      font-size: 24px;
    }
    .step-value {
      min-width: 72px;
      text-align: center;
      font-size: 18px;
      font-weight: 600;
    }
    .chips {
      flex-direction: row;
      gap: 8px;
    }
    .links {
      gap: 0;
    }
    .link {
      min-height: 56px;
      justify-content: center;
      gap: 2px;
      border-bottom-width: 1px;
      border-bottom-color: var(--border);
    }
  `,
})
export class SettingsPage {
  protected readonly store = inject(SettingsStore);
  protected readonly theme = inject(ThemeService);
  private readonly nav = inject(NativeNavigation);
  private readonly dialogs = inject(Dialogs);
  private readonly browser = inject(Browser);

  protected readonly minSnooze = SNOOZE_MIN_MINUTES;
  protected readonly maxSnooze = SNOOZE_MAX_MINUTES;

  /** Texto de versión instalada, p. ej. "1.0.0 (1)". */
  protected readonly version = (() => {
    const info = inject(AppInfo);
    return `${info.version ?? 'desconocida'}${info.build ? ` (${info.build})` : ''}`;
  })();

  protected back(): void {
    this.nav.back();
  }

  protected about(): void {
    void this.nav.push('/about');
  }

  protected changeSnooze(delta: number): void {
    void this.store.update({ snoozeMinutes: this.store.settings().snoozeMinutes + delta });
  }

  protected setFormat(format: TimeFormat): void {
    void this.store.update({ timeFormat: format });
  }

  protected async privacy(): Promise<void> {
    if (PRIVACY_POLICY_URL === null) {
      // Aún no hay URL pública definida (ver docs/OPEN_DECISIONS.md #6).
      await this.dialogs.tell(
        'Política de privacidad',
        'Alarmap no recopila ni envía datos: todo se guarda solo en tu dispositivo. El texto completo estará disponible próximamente.',
      );
      return;
    }
    await this.browser.open(PRIVACY_POLICY_URL);
  }
}
