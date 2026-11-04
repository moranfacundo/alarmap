import { withComponentInputBinding } from '@angular/router';
import { provideNativeRouter } from '@ng-native/router';
import { render, screen, userEvent } from '@ng-native/testing';
import { expect, test } from 'vitest';
import { App } from './app.ts';
import { routes } from './app.routes.ts';
import { AlarmRepository } from './features/alarms/data/alarm.repository.ts';
import type { Alarm } from './features/alarms/domain/alarm.model.ts';
import { SettingsRepository } from './features/settings/data/settings.repository.ts';
import { DEFAULT_SETTINGS } from './features/settings/domain/settings.model.ts';

/** Alarma de prueba. */
const alarm = (id: string, hour: number, minute: number, label: string): Alarm => ({
  id,
  label,
  enabled: true,
  type: 'weekly',
  hour,
  minute,
  date: null,
  weekdays: [0, 1, 2, 3, 4],
  dayOfMonth: null,
  toneId: 'default',
  createdAt: 1,
  updatedAt: 1,
});

/** Repositorios en memoria: los tests no tocan SQLite. */
function providers(initial: Alarm[]) {
  const store = [...initial];
  const alarmRepo = {
    list: async () => [...store],
    upsert: async (a: Alarm) => {
      store.splice(0, store.length, ...store.filter((x) => x.id !== a.id), a);
    },
    setEnabled: async () => {},
    remove: async () => {},
  };
  const settingsRepo = { get: async () => DEFAULT_SETTINGS, save: async () => {} };
  return [
    provideNativeRouter(routes, withComponentInputBinding()),
    { provide: AlarmRepository, useValue: alarmRepo },
    { provide: SettingsRepository, useValue: settingsRepo },
  ];
}

test('sin alarmas muestra el estado vacío', async () => {
  await render(App, { providers: providers([]) });
  expect(await screen.findByText('Sin alarmas')).toBeTruthy();
});

test('las alarmas se muestran ordenadas por hora', async () => {
  await render(App, {
    providers: providers([alarm('b', 9, 0, 'Segunda'), alarm('a', 6, 30, 'Primera')]),
  });
  const first = await screen.findByText('Primera');
  const second = await screen.findByText('Segunda');
  expect(first).toBeTruthy();
  expect(second).toBeTruthy();
  expect(screen.getByText('06:30')).toBeTruthy();
});

test('el botón + abre la selección de tipo', async () => {
  await render(App, { providers: providers([]) });
  await userEvent.press(await screen.findByRole('button', { name: 'Crear alarma' }));
  expect(await screen.findByText('¿Qué tipo de alarma quieres crear?')).toBeTruthy();
});

test('una alarma semanal sin días no se puede guardar', async () => {
  await render(App, { providers: providers([]) });
  await userEvent.press(await screen.findByRole('button', { name: 'Crear alarma' }));
  await userEvent.press(await screen.findByRole('button', { name: /^Semanal/ }));
  await userEvent.press(await screen.findByRole('button', { name: 'Guardar' }));
  expect(await screen.findByText('Elige al menos un día de la semana.')).toBeTruthy();
});
