import { Injectable, inject, signal } from '@angular/core';
import { EngineSync } from '../../alarms/application/engine-sync.ts';
import { SettingsRepository } from '../data/settings.repository.ts';
import { DEFAULT_SETTINGS, type Settings, clampSnooze } from '../domain/settings.model.ts';

/** Estado de las preferencias globales para la UI (signals). */
@Injectable({ providedIn: 'root' })
export class SettingsStore {
  private readonly repo = inject(SettingsRepository);
  private readonly engineSync = inject(EngineSync);

  readonly settings = signal<Settings>(DEFAULT_SETTINGS);
  readonly loaded = signal(false);

  async load(): Promise<void> {
    try {
      this.settings.set(await this.repo.get());
    } finally {
      this.loaded.set(true);
    }
  }

  /** Aplica un cambio parcial y lo guarda. El snooze se limita al rango permitido. */
  async update(change: Partial<Settings>): Promise<void> {
    const next: Settings = {
      ...this.settings(),
      ...change,
      snoozeMinutes: clampSnooze(change.snoozeMinutes ?? this.settings().snoozeMinutes),
    };
    this.settings.set(next); // actualización optimista: la UI responde de inmediato
    await this.repo.save(next);
    // Snooze/vibración/formato viven en el snapshot del motor.
    await this.engineSync.push().catch(() => {});
  }
}
