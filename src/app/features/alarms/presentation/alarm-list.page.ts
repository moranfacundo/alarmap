import { Component, OnInit, inject } from '@angular/core';
import { Pressable, SafeAreaView, ScrollView, Text, View } from '@ng-native/components';
import { NativeNavigation } from '@ng-native/router';
import { TopBar } from '../../../shared/components/top-bar.ts';
import { SettingsStore } from '../../settings/application/settings.store.ts';
import { AlarmStore } from '../application/alarm.store.ts';
import { AlarmCard } from './alarm-card.ts';

/** Pantalla principal: lista de alarmas, acceso a Ajustes y botón flotante (+) para crear. */
@Component({
  selector: 'app-alarm-list-page',
  imports: [AlarmCard, Pressable, SafeAreaView, ScrollView, Text, TopBar, View],
  template: `
    <safe-area-view class="screen">
      <app-top-bar title="Alarmap">
        <pressable
          class="action"
          accessibilityRole="button"
          accessibilityLabel="Ajustes"
          (press)="openSettings()"
        >
          <text class="action-text">Ajustes</text>
        </pressable>
      </app-top-bar>

      @if (store.error(); as error) {
        <text class="notice">{{ error }}</text>
      }

      <!-- El botón flotante vive dentro de este contenedor: un elemento absoluto ignora el padding
           del safe-area-view y, fuera de aquí, quedaría debajo de la barra de navegación. -->
      <view class="body">
        @if (store.loaded() && store.alarms().length === 0 && !store.error()) {
          <view class="empty">
            <text class="empty-title">Sin alarmas</text>
            <text class="empty-hint">Toca + para crear tu primera alarma.</text>
          </view>
        } @else {
          <scroll-view class="scroll">
            <view class="list">
              @for (alarm of store.alarms(); track alarm.id) {
                <app-alarm-card
                  [alarm]="alarm"
                  [timeFormat]="settings.settings().timeFormat"
                  (open)="edit(alarm.id)"
                  (toggle)="toggle(alarm.id, $event)"
                />
              }
            </view>
          </scroll-view>
        }

        <pressable
          class="fab"
          accessibilityRole="button"
          accessibilityLabel="Crear alarma"
          (press)="create()"
        >
          <text class="fab-text">+</text>
        </pressable>
      </view>
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
    .action {
      min-height: 40px;
      padding: 0 8px;
      align-items: center;
      justify-content: center;
    }
    .action-text {
      font-size: 15px;
      font-weight: 600;
    }
    .body {
      flex: 1;
    }
    .scroll {
      flex: 1;
    }
    .list {
      gap: 12px;
      padding: 8px 16px 112px;
    }
    .notice {
      margin: 8px 16px;
      font-size: 14px;
      color: var(--text-muted);
    }
    .empty {
      flex: 1;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .empty-title {
      font-size: 20px;
      font-weight: 600;
    }
    .empty-hint {
      font-size: 15px;
      color: var(--text-muted);
    }
    .fab {
      position: absolute;
      right: 20px;
      bottom: 24px;
      width: 60px;
      height: 60px;
      align-items: center;
      justify-content: center;
      border-radius: 20px;
      background-color: var(--accent);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    }
    .fab-text {
      font-size: 32px;
      font-weight: 500;
      color: var(--on-accent);
    }
  `,
})
export class AlarmListPage implements OnInit {
  protected readonly store = inject(AlarmStore);
  protected readonly settings = inject(SettingsStore);
  private readonly nav = inject(NativeNavigation);

  ngOnInit(): void {
    // Carga inicial desde SQLite; las pantallas siguientes reutilizan este estado.
    void this.store.load();
    void this.settings.load();
  }

  protected create(): void {
    void this.nav.push('/alarm/new');
  }

  protected edit(id: string): void {
    void this.nav.push(['/alarm', id]);
  }

  protected openSettings(): void {
    void this.nav.push('/settings');
  }

  protected toggle(id: string, enabled: boolean): void {
    void this.store.toggle(id, enabled);
  }
}
