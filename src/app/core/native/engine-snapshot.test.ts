import { expect, test } from 'vitest';
import type { Alarm } from '../../features/alarms/domain/alarm.model.ts';
import { DEFAULT_SETTINGS } from '../../features/settings/domain/settings.model.ts';
import { buildEngineSnapshot } from './engine-snapshot.ts';

const base: Alarm = {
  id: 'a1', label: 'x', enabled: true, type: 'weekly', hour: 7, minute: 30, date: null,
  weekdays: [0, 2], dayOfMonth: null, toneId: 'default', category: 'routine', tags: ['x1 Aciclovir'],
  createdAt: 1, updatedAt: 2,
};

test('serializa máscara de días, nulls, tags y ajustes', () => {
  const snap = JSON.parse(buildEngineSnapshot([base], DEFAULT_SETTINGS));
  expect(snap.version).toBe(1);
  expect(snap.settings).toEqual({ vibration: true, snoozeMinutes: 5, timeFormat: 24 });
  expect(snap.alarms[0]).toEqual({
    id: 'a1', label: 'x', enabled: true, type: 'weekly', hour: 7, minute: 30, date: null,
    weekdaysMask: 0b101, dayOfMonth: null, toneId: 'default', tags: ['x1 Aciclovir'],
  });
});
