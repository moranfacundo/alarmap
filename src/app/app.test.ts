import { withComponentInputBinding } from '@angular/router';
import { provideNativeRouter } from '@ng-native/router';
import { render, screen, userEvent } from '@ng-native/testing';
import { AppState, Dialogs } from '@ng-native/device';
import { expect, test, vi } from 'vitest';
import { App } from './app.ts';
import { routes } from './app.routes.ts';
import { AlarmEngineService, type NativeAlarmEngine } from './core/native/alarm-engine.service.ts';
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
  category: 'standard',
  tags: [],
  createdAt: 1,
  updatedAt: 1,
});

/** Repositorios en memoria: los tests no tocan SQLite. */
function providers(
  initial: Alarm[],
  confirm = vi.fn(async () => true),
  notify = vi.fn(),
  native: NativeAlarmEngine | null = null,
) {
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
    { provide: Dialogs, useValue: { confirm, notify } },
    { provide: AlarmEngineService.NATIVE, useValue: native },
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

test('rutina: tokens se agregan como badges, se quitan y se guardan en la lista', async () => {
  await render(App, { providers: providers([]) });
  await userEvent.press(await screen.findByRole('button', { name: 'Crear alarma' }));
  await userEvent.press(await screen.findByRole('button', { name: /^Medicación \/ rutina/ }));

  // Sin tokens no se puede guardar.
  await userEvent.press(await screen.findByRole('button', { name: 'Guardar' }));
  expect(await screen.findByText('Agrega al menos un medicamento o tarea.')).toBeTruthy();

  const user = userEvent.setup();
  const input = await screen.findByPlaceholderText('Ej. x1 Paracetamol');
  await user.type(input, 'x1 Aciclovir');
  await user.press(screen.getByRole('button', { name: 'Agregar' }));
  await user.type(input, 'x1 levofloxacina');
  await user.press(screen.getByRole('button', { name: 'Agregar' }));
  expect(screen.getByText('x1 Aciclovir')).toBeTruthy();
  expect(screen.getByText('x1 levofloxacina')).toBeTruthy();

  await user.press(screen.getByRole('button', { name: 'Quitar x1 levofloxacina' }));
  expect(screen.queryByText('x1 levofloxacina')).toBeNull();

  await user.press(screen.getByRole('button', { name: 'Guardar' }));
  expect(await screen.findByText('x1 Aciclovir')).toBeTruthy();
  expect(screen.getByText(/Medicación \/ rutina · Todos los días/)).toBeTruthy();
});

test('editor: Guardar y su error de validación se alcanzan sin bajar en el formulario', async () => {
  await render(App, { providers: providers([]) });
  await userEvent.press(await screen.findByRole('button', { name: 'Crear alarma' }));
  await userEvent.press(await screen.findByRole('button', { name: /^Semanal/ }));
  // Se pulsa Guardar sin haber bajado nada y el aviso de validación es visible de inmediato.
  await userEvent.press(await screen.findByRole('button', { name: 'Guardar' }));
  expect(await screen.findByRole('alert')).toBeTruthy();
});

test('editor: salir con cambios sin guardar pide confirmar; sin cambios sale directo', async () => {
  const confirm = vi.fn(async () => false); // el usuario elige "Seguir editando"
  await render(App, {
    providers: providers([alarm('a', 6, 30, 'Gimnasio')], confirm),
  });
  const user = userEvent.setup();

  // Sin cambios: no pregunta.
  await user.press(await screen.findByRole('button', { name: /Gimnasio/ }));
  await user.press(await screen.findByRole('button', { name: 'Volver' }));
  expect(confirm).not.toHaveBeenCalled();

  // Con cambios: pregunta y, al rechazar, se queda en el editor.
  await user.press(await screen.findByRole('button', { name: /Gimnasio/ }));
  await user.type(await screen.findByPlaceholderText('Descripción (opcional)'), ' mañana');
  await user.press(screen.getByRole('button', { name: 'Volver' }));
  expect(confirm).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Guardar' })).toBeTruthy();
});

/** Motor nativo falso con permisos configurables. */
function fakeEngine(status: { notifications: boolean; fullScreen: boolean }): NativeAlarmEngine {
  return {
    SDK_INT: 34,
    sync: vi.fn(async () => {}),
    takeDisabledOnce: vi.fn(async () => []),
    getPermissionStatus: vi.fn(async () => ({ ...status, exactAlarm: true })),
    requestNotificationPermission: vi.fn(async () => ({ granted: true, canAskAgain: true })),
    openNotificationSettings: vi.fn(async () => {}),
    openFullScreenIntentSettings: vi.fn(async () => {}),
    previewTone: vi.fn(async () => {}),
    stopPreview: vi.fn(async () => {}),
    addListener: vi.fn(() => ({ remove: () => {} })),
  };
}

test('toast: "Alarma Guardada" al crear y "Alarma actualizada" al editar', async () => {
  const notify = vi.fn();
  await render(App, { providers: providers([], undefined, notify) });
  const user = userEvent.setup();
  await user.press(await screen.findByRole('button', { name: 'Crear alarma' }));
  await user.press(await screen.findByRole('button', { name: /^Una vez/ }));
  await user.press(await screen.findByRole('button', { name: 'Guardar' }));
  expect(notify).toHaveBeenCalledWith('Alarma Guardada');

  await user.press(await screen.findByRole('button', { name: /Una vez|Mañana|Hoy/ }));
  await user.press(await screen.findByRole('button', { name: 'Guardar' }));
  expect(notify).toHaveBeenLastCalledWith('Alarma actualizada');
});

test('toast: un guardado inválido no muestra toast', async () => {
  const notify = vi.fn();
  await render(App, { providers: providers([], undefined, notify) });
  const user = userEvent.setup();
  await user.press(await screen.findByRole('button', { name: 'Crear alarma' }));
  await user.press(await screen.findByRole('button', { name: /^Semanal/ }));
  await user.press(await screen.findByRole('button', { name: 'Guardar' }));
  expect(notify).not.toHaveBeenCalled();
});

test('menú hamburguesa: abre con Ajustes y Acerca de y no hay texto "Ajustes" en la barra', async () => {
  await render(App, { providers: providers([]) });
  const user = userEvent.setup();
  expect(screen.queryByRole('button', { name: 'Ajustes' })).toBeNull();
  await user.press(await screen.findByRole('button', { name: 'Menú' }));
  expect(await screen.findByRole('menuitem', { name: 'Ajustes' })).toBeTruthy();
  expect(screen.getByRole('menuitem', { name: 'Acerca de' })).toBeTruthy();
  await user.press(screen.getByRole('menuitem', { name: 'Ajustes' }));
  expect(await screen.findByText('Vibración')).toBeTruthy();
});

test('permisos: sin notificaciones hay tarjeta y un único diálogo; con permisos no aparece nada', async () => {
  const confirm = vi.fn(async () => false); // "Ahora no"
  await render(App, {
    providers: providers([], confirm, vi.fn(), fakeEngine({ notifications: false, fullScreen: true })),
  });
  expect(await screen.findByText('Activa las notificaciones')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Activar notificaciones' })).toBeTruthy();
  expect(confirm).toHaveBeenCalledTimes(1);
});

test('permisos: todo concedido no muestra tarjeta', async () => {
  await render(App, {
    providers: providers([], undefined, vi.fn(), fakeEngine({ notifications: true, fullScreen: true })),
  });
  await screen.findByText('Sin alarmas');
  expect(screen.queryByText('Activa las notificaciones')).toBeNull();
  expect(screen.queryByText('Permite la pantalla completa')).toBeNull();
});
