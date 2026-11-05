import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { AlarmEngineService } from '../../../core/native/alarm-engine.service.ts';
import { EngineSync } from './engine-sync.ts';
import { AlarmRepository } from '../data/alarm.repository.ts';
import { sortAlarms } from '../domain/alarm-sort.ts';
import type { Alarm, AlarmDraft } from '../domain/alarm.model.ts';
import { newId } from '../../../shared/utils/id.ts';

/**
 * Estado de las alarmas para la UI (signals). Persiste en SQLite a través del repositorio.
 * La programación en el sistema (AlarmManager) es del motor nativo (Kotlin): tras cada cambio se le
 * pide recalcular esa alarma; el motor lee SQLite por su cuenta.
 */
@Injectable({ providedIn: 'root' })
export class AlarmStore {
  private readonly repo = inject(AlarmRepository);
  private readonly engine = inject(AlarmEngineService);
  private readonly engineSync = inject(EngineSync);
  private readonly items = signal<readonly Alarm[]>([]);

  /** Alarmas ordenadas por hora (independiente de si están activas). */
  readonly alarms = computed(() => sortAlarms(this.items()));
  readonly loaded = signal(false);
  /** Mensaje de error de la última operación fallida, o `null`. */
  readonly error = signal<string | null>(null);

  constructor() {
    // El motor desactiva por su cuenta las alarmas "una vez" que ya sonaron: se recarga la lista.
    const sub = this.engine.onAlarmsChanged(() => void this.load());
    inject(DestroyRef).onDestroy(() => sub?.remove());
  }

  async load(): Promise<void> {
    try {
      // El motor desactiva "una vez" por su cuenta: se aplica a SQLite (fuente de verdad) antes de leer.
      await this.applyEngineDisabled();
      this.items.set(await this.repo.list());
      this.error.set(null);
      await this.sync(); // re-arma todo (arranque de la app, o tras un cambio hecho por el motor)
    } catch (e) {
      this.error.set(`No se pudieron cargar las alarmas: ${String(e)}`);
    } finally {
      this.loaded.set(true);
    }
  }

  byId(id: string): Alarm | undefined {
    return this.items().find((a) => a.id === id);
  }

  /** Crea (sin `id`) o actualiza (con `id`) una alarma. Devuelve la alarma guardada. */
  async save(draft: AlarmDraft, id?: string): Promise<Alarm> {
    const now = Date.now();
    const existing = id ? this.byId(id) : undefined;
    const alarm: Alarm = {
      ...draft,
      id: existing?.id ?? newId(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await this.repo.upsert(alarm);
    this.items.update((list) => [...list.filter((a) => a.id !== alarm.id), alarm]);
    await this.sync();
    return alarm;
  }

  async toggle(id: string, enabled: boolean): Promise<void> {
    const now = Date.now();
    await this.repo.setEnabled(id, enabled, now);
    this.items.update((list) =>
      list.map((a) => (a.id === id ? { ...a, enabled, updatedAt: now } : a)),
    );
    await this.sync();
  }

  async remove(id: string): Promise<void> {
    await this.repo.remove(id);
    this.items.update((list) => list.filter((a) => a.id !== id));
    await this.sync();
  }

  private async applyEngineDisabled(): Promise<void> {
    try {
      const ids = await this.engine.takeDisabledOnce();
      const now = Date.now();
      for (const id of ids) await this.repo.setEnabled(id, false, now);
    } catch (e) {
      this.engineFailed(e);
    }
  }

  /** Entrega al motor el estado completo. Si falla, la alarma queda guardada pero se avisa. */
  private async sync(): Promise<void> {
    try {
      await this.engineSync.push();
    } catch (e) {
      this.engineFailed(e);
    }
  }

  private engineFailed(e: unknown): void {
    this.error.set(`No se pudo programar la alarma en el sistema: ${String(e)}`);
  }
}
