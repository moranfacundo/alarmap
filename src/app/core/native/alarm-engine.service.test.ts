import { expect, test, vi } from 'vitest';
import { injectService } from '@ng-native/testing';
import { AlarmEngineService, type NativeAlarmEngine } from './alarm-engine.service.ts';

function fakeEngine(): NativeAlarmEngine {
  return {
    SDK_INT: 34,
    sync: vi.fn(async () => {}),
    takeDisabledOnce: vi.fn(async () => ['a1']),
    getPermissionStatus: vi.fn(async () => ({ notifications: true, fullScreen: false, exactAlarm: true })),
    requestNotificationPermission: vi.fn(async () => ({ granted: true, canAskAgain: true })),
    openNotificationSettings: vi.fn(async () => {}),
    openFullScreenIntentSettings: vi.fn(async () => {}),
    previewTone: vi.fn(async () => {}),
    stopPreview: vi.fn(async () => {}),
    addListener: vi.fn(() => ({ remove: () => {} })),
  };
}

test('delega en el módulo nativo inyectado', async () => {
  const fake = fakeEngine();
  const svc = injectService(AlarmEngineService, {
    providers: [{ provide: AlarmEngineService.NATIVE, useValue: fake }],
  });
  expect(svc.isAvailable).toBe(true);
  await svc.sync('{}');
  await svc.previewTone('bell');
  expect(fake.sync).toHaveBeenCalledWith('{}');
  expect(await svc.takeDisabledOnce()).toEqual(['a1']);
  expect(fake.previewTone).toHaveBeenCalledWith('bell');
  expect(await svc.permissionStatus()).toEqual({ notifications: true, fullScreen: false, exactAlarm: true });
  expect(svc.onAlarmsChanged(() => {})).not.toBeNull();
});

test('degrada con elegancia si el módulo no existe', async () => {
  const svc = injectService(AlarmEngineService, {
    providers: [{ provide: AlarmEngineService.NATIVE, useValue: null }],
  });
  expect(svc.isAvailable).toBe(false);
  await expect(svc.sync('{}')).resolves.toBeUndefined();
  expect(await svc.takeDisabledOnce()).toEqual([]);
  expect(await svc.permissionStatus()).toBeNull();
  expect(await svc.requestNotificationPermission()).toEqual({ granted: true, canAskAgain: false });
  await expect(svc.openNotificationSettings()).resolves.toBeUndefined();
  expect(svc.onAlarmsChanged(() => {})).toBeNull();
});
