import { Injectable, InjectionToken, inject } from '@angular/core';

/** Estado de los permisos que el motor necesita para sonar de forma fiable. */
export interface PermissionStatus {
  readonly notifications: boolean;
  readonly fullScreen: boolean;
  readonly exactAlarm: boolean;
}

/** Respuesta de Expo al pedir un permiso en tiempo de ejecución. */
export interface PermissionResponse {
  readonly granted: boolean;
  /** `false` cuando Android ya no mostrará el diálogo (rechazado dos veces): hay que ir a ajustes. */
  readonly canAskAgain: boolean;
}

/** Suscripción a un evento nativo. */
export interface NativeSubscription {
  remove(): void;
}

/**
 * Refleja exactamente lo que expone modules/alarm-engine en Kotlin (AlarmEngineModule.kt).
 * No hay verificación automática: al cambiar Kotlin hay que actualizar esta interfaz a mano.
 * El motor lee SQLite directamente, por eso `reschedule` solo recibe el id.
 */
export interface NativeAlarmEngine {
  readonly SDK_INT: number;
  reschedule(alarmId: string): Promise<void>;
  rescheduleAll(): Promise<void>;
  getPermissionStatus(): Promise<PermissionStatus>;
  requestNotificationPermission(): Promise<PermissionResponse>;
  openNotificationSettings(): Promise<void>;
  openFullScreenIntentSettings(): Promise<void>;
  previewTone(toneId: string): Promise<void>;
  stopPreview(): Promise<void>;
  addListener(event: 'onAlarmsChanged', listener: () => void): NativeSubscription;
}

/**
 * Puente Angular ↔ motor de alarmas (Kotlin). Sin módulo (Expo Go, tests en Node) todo es un
 * no-op y `isAvailable` es false: la UI sigue funcionando, solo que nada suena.
 */
@Injectable({ providedIn: 'root' })
export class AlarmEngineService {
  /** `null` si el módulo no está en la build. En los tests se reemplaza por un falso. */
  static readonly NATIVE = new InjectionToken<NativeAlarmEngine | null>('AlarmEngine.native', {
    factory: () =>
      typeof require === 'function'
        ? (require('expo') as typeof import('expo')).requireOptionalNativeModule<NativeAlarmEngine>(
            'AlarmEngine',
          )
        : null,
  });

  private readonly native = inject(AlarmEngineService.NATIVE);

  get isAvailable(): boolean {
    return this.native !== null;
  }

  /** Recalcula y programa una alarma (tras guardar, activar/desactivar o borrar). */
  async reschedule(alarmId: string): Promise<void> {
    await this.native?.reschedule(alarmId);
  }

  /** Recalcula todas las alarmas desde SQLite. */
  async rescheduleAll(): Promise<void> {
    await this.native?.rescheduleAll();
  }

  /** `null` si no hay módulo nativo. */
  async permissionStatus(): Promise<PermissionStatus | null> {
    return this.native ? this.native.getPermissionStatus() : null;
  }

  /** Diálogo del sistema. Sin módulo nativo se devuelve como concedido (no hay nada que pedir). */
  async requestNotificationPermission(): Promise<PermissionResponse> {
    return this.native
      ? this.native.requestNotificationPermission()
      : { granted: true, canAskAgain: false };
  }

  async openNotificationSettings(): Promise<void> {
    await this.native?.openNotificationSettings();
  }

  async openFullScreenIntentSettings(): Promise<void> {
    await this.native?.openFullScreenIntentSettings();
  }

  async previewTone(toneId: string): Promise<void> {
    await this.native?.previewTone(toneId);
  }

  async stopPreview(): Promise<void> {
    await this.native?.stopPreview();
  }

  /** El motor desactivó alarmas por su cuenta (una "una vez" que sonó): hay que recargar. */
  onAlarmsChanged(listener: () => void): NativeSubscription | null {
    return this.native?.addListener('onAlarmsChanged', listener) ?? null;
  }
}
