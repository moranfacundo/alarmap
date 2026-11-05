import { Injectable, inject } from '@angular/core';
import { AlarmEngineService } from '../../../core/native/alarm-engine.service.ts';
import { buildEngineSnapshot } from '../../../core/native/engine-snapshot.ts';
import { SettingsRepository } from '../../settings/data/settings.repository.ts';
import { AlarmRepository } from '../data/alarm.repository.ts';

/**
 * Envía al motor nativo la proyección actual de SQLite (alarmas + ajustes). Lee de los
 * repositorios, no de signals: SQLite es la fuente de verdad y así no hay dependencia con los stores.
 */
@Injectable({ providedIn: 'root' })
export class EngineSync {
  private readonly engine = inject(AlarmEngineService);
  private readonly alarms = inject(AlarmRepository);
  private readonly settings = inject(SettingsRepository);

  async push(): Promise<void> {
    if (!this.engine.isAvailable) return;
    const [alarms, settings] = await Promise.all([this.alarms.list(), this.settings.get()]);
    await this.engine.sync(buildEngineSnapshot(alarms, settings));
  }
}
