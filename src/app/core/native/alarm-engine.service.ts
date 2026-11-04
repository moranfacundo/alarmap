import { Injectable, InjectionToken, inject } from '@angular/core';

/**
 * Refleja exactamente lo que expone modules/alarm-engine en Kotlin.
 * No hay verificación automática: al cambiar Kotlin hay que actualizar esta interfaz a mano.
 */
export interface NativeAlarmEngine {
  readonly SDK_INT: number;
  ping(): string;
  pingAsync(value: string): Promise<string>;
}

/** Puente Angular ↔ módulo nativo `alarm-engine`. Aquí irá la API del motor de alarmas. */
@Injectable({ providedIn: 'root' })
export class AlarmEngineService {
  /** `null` si el módulo no está en la build (Expo Go, tests en Node). En los tests se reemplaza por un falso. */
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

  /** Prueba de enlace: devuelve `pong:<valor>` si el módulo Kotlin está enlazado, o `null` si no. */
  async ping(value = 'ok'): Promise<string | null> {
    return this.native ? this.native.pingAsync(value) : null;
  }

  get sdkInt(): number | null {
    return this.native?.SDK_INT ?? null;
  }
}
