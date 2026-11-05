import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { AppState, Dialogs } from '@ng-native/device';
import { Pressable, SafeAreaView, ScrollView, Text, View } from '@ng-native/components';
import { NativeNavigation } from '@ng-native/router';
import {
  AlarmEngineService,
  type PermissionStatus,
} from '../../../core/native/alarm-engine.service.ts';
import { MenuButton } from '../../../shared/components/menu-button.ts';
import { TopBar } from '../../../shared/components/top-bar.ts';
import { SettingsStore } from '../../settings/application/settings.store.ts';
import { AlarmStore } from '../application/alarm.store.ts';
import { AlarmCard } from './alarm-card.ts';

/** Pantalla principal: lista de alarmas, menú (Ajustes y Acerca de) y botón flotante (+) para crear. */
@Component({
  selector: 'app-alarm-list-page',
  imports: [AlarmCard, MenuButton, Pressable, SafeAreaView, ScrollView, Text, TopBar, View],
  template: `
    <safe-area-view class="screen">
     <view class="root">
      <app-top-bar title="AlarMap">
        <app-menu-button [expanded]="menuOpen()" (press)="menuOpen.set(!menuOpen())" />
      </app-top-bar>

      @if (store.error(); as error) {
        <text class="notice">{{ error }}</text>
      }

      @if (permissionIssue(); as issue) {
        <!-- Tarjeta con aspecto de notificación: entra deslizando y tiene su propio botón de acción. -->
        <view class="permission" accessibilityRole="alert">
          <view class="permission-head">
            <view class="permission-icon" aria-hidden="true"><text class="permission-icon-text">!</text></view>
            <view class="permission-text">
              <text class="permission-title">{{ issue.title }}</text>
              <text class="permission-hint">{{ issue.hint }}</text>
            </view>
          </view>
          <pressable
            class="permission-action"
            accessibilityRole="button"
            [accessibilityLabel]="issue.actionLabel"
            (press)="fixPermission()"
          >
            <text class="permission-action-text">{{ issue.action }}</text>
          </pressable>
        </view>
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

      @if (menuOpen()) {
        <!-- Cierra al tocar fuera. El menú se ancla bajo el botón (arriba a la derecha). -->
        <pressable
          class="backdrop"
          accessibilityLabel="Cerrar menú"
          (press)="menuOpen.set(false)"
        />
        <view class="menu" accessibilityRole="menu">
          <pressable class="menu-item" accessibilityRole="menuitem" (press)="go('/settings')">
            <text class="menu-text">Ajustes</text>
          </pressable>
          <pressable class="menu-item" accessibilityRole="menuitem" (press)="go('/about')">
            <text class="menu-text">Acerca de</text>
          </pressable>
        </view>
      }
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
    .root {
      flex: 1;
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
    .permission {
      margin: 8px 16px 0;
      padding: 14px 16px;
      gap: 12px;
      border-radius: 20px;
      border-width: 1px;
      border-color: var(--border);
      background-color: var(--surface-alt);
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
      animation: permission-in 320ms ease-out;
    }
    @keyframes permission-in {
      from {
        opacity: 0;
        transform: translateY(-16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .permission-head {
      flex-direction: row;
      gap: 12px;
      align-items: center;
    }
    .permission-icon {
      width: 40px;
      height: 40px;
      align-items: center;
      justify-content: center;
      border-radius: 20px;
      background-color: var(--accent);
    }
    .permission-icon-text {
      font-size: 22px;
      font-weight: 700;
      color: var(--on-accent);
    }
    .permission-text {
      flex: 1;
      gap: 2px;
    }
    .permission-title {
      font-size: 16px;
      font-weight: 700;
    }
    .permission-hint {
      font-size: 14px;
      color: var(--text-muted);
    }
    .permission-action {
      align-self: flex-end;
      min-height: 48px;
      padding: 0 24px;
      align-items: center;
      justify-content: center;
      border-radius: 24px;
      background-color: var(--accent);
    }
    .permission-action-text {
      font-size: 15px;
      font-weight: 600;
      color: var(--on-accent);
    }
    .backdrop {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
    .menu {
      position: absolute;
      top: 52px;
      right: 16px;
      min-width: 200px;
      padding: 4px 0;
      border-radius: 16px;
      border-width: 1px;
      border-color: var(--border);
      background-color: var(--surface);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
    }
    .menu-item {
      min-height: 48px;
      padding: 0 20px;
      justify-content: center;
    }
    .menu-text {
      font-size: 16px;
      font-weight: 500;
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
  private readonly engine = inject(AlarmEngineService);
  private readonly dialogs = inject(Dialogs);
  private readonly permissions = signal<PermissionStatus | null>(null);

  /** El diálogo de permisos se ofrece una sola vez por arranque: la tarjeta queda como recordatorio. */
  private static promptedThisLaunch = false;

  protected readonly menuOpen = signal(false);

  /** Primer permiso que impide que la alarma se vea o se oiga bien, o `null` si todo está en orden. */
  protected readonly permissionIssue = computed(() => {
    const p = this.permissions();
    if (!p) return null;
    if (!p.notifications) {
      return {
        title: 'Activa las notificaciones',
        hint: 'Sin ellas, la alarma no se muestra cuando suena.',
        action: 'Activar',
        actionLabel: 'Activar notificaciones',
      };
    }
    if (!p.fullScreen) {
      return {
        title: 'Permite la pantalla completa',
        hint: 'Para ver la alarma a pantalla completa con el teléfono bloqueado.',
        action: 'Abrir ajustes',
        actionLabel: 'Abrir ajustes de pantalla completa',
      };
    }
    return null;
  });

  constructor() {
    // Al volver a primer plano (p. ej. tras conceder el permiso en ajustes) se vuelve a consultar.
    const appState = inject(AppState);
    effect(() => {
      if (appState.active()) void this.refreshPermissions();
    });
  }

  ngOnInit(): void {
    // Carga inicial desde SQLite; las pantallas siguientes reutilizan este estado.
    void this.store.load();
    void this.settings.load();
  }

  private async refreshPermissions(): Promise<void> {
    try {
      this.permissions.set(await this.engine.permissionStatus());
    } catch {
      this.permissions.set(null); // el aviso es auxiliar: si falla la consulta, no se muestra
      return;
    }
    await this.promptOnce();
  }

  /** Diálogo nativo, una sola vez por arranque, si falta algún permiso. */
  private async promptOnce(): Promise<void> {
    const issue = this.permissionIssue();
    if (!issue || AlarmListPage.promptedThisLaunch) return;
    AlarmListPage.promptedThisLaunch = true;
    const accept = await this.dialogs.confirm(issue.title, {
      message: issue.hint,
      confirm: issue.action,
      cancel: 'Ahora no',
    });
    if (accept) await this.fixPermission();
  }

  protected async fixPermission(): Promise<void> {
    try {
      if (this.permissions()?.notifications === false) {
        const answer = await this.engine.requestNotificationPermission();
        // Rechazado dos veces: Android ya no muestra el diálogo, solo queda activarlo en ajustes.
        if (!answer.granted && !answer.canAskAgain) await this.engine.openNotificationSettings();
      } else {
        await this.engine.openFullScreenIntentSettings();
      }
    } finally {
      this.permissions.set(await this.engine.permissionStatus().catch(() => null));
    }
  }

  protected go(path: '/settings' | '/about'): void {
    this.menuOpen.set(false);
    void this.nav.push(path);
  }

  protected create(): void {
    void this.nav.push('/alarm/new');
  }

  protected edit(id: string): void {
    void this.nav.push(['/alarm', id]);
  }

  protected toggle(id: string, enabled: boolean): void {
    void this.store.toggle(id, enabled);
  }
}
