import { Injectable, computed, inject, signal } from '@angular/core';
import { AlarmRepository } from '../data/alarm.repository.ts';
import { sortAlarms } from '../domain/alarm-sort.ts';
import type { Alarm, AlarmDraft } from '../domain/alarm.model.ts';
import { newId } from '../../../shared/utils/id.ts';

/**
 * Estado de las alarmas para la UI (signals). Persiste en SQLite a través del repositorio.
 * Aquí NO se programa nada en el sistema: eso será responsabilidad del módulo nativo (Kotlin).
 */
@Injectable({ providedIn: 'root' })
export class AlarmStore {
  private readonly repo = inject(AlarmRepository);
  private readonly items = signal<readonly Alarm[]>([]);

  /** Alarmas ordenadas por hora (independiente de si están activas). */
  readonly alarms = computed(() => sortAlarms(this.items()));
  readonly loaded = signal(false);
  /** Mensaje de error de la última operación fallida, o `null`. */
  readonly error = signal<string | null>(null);

  async load(): Promise<void> {
    try {
      this.items.set(await this.repo.list());
      this.error.set(null);
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
    return alarm;
  }

  async toggle(id: string, enabled: boolean): Promise<void> {
    const now = Date.now();
    await this.repo.setEnabled(id, enabled, now);
    this.items.update((list) =>
      list.map((a) => (a.id === id ? { ...a, enabled, updatedAt: now } : a)),
    );
  }

  async remove(id: string): Promise<void> {
    await this.repo.remove(id);
    this.items.update((list) => list.filter((a) => a.id !== id));
  }
}
