import { expect, test } from 'vitest';
import { injectService } from '@ng-native/testing';
import { AlarmEngineService } from './alarm-engine.service.ts';

test('usa el módulo nativo inyectado', async () => {
  const fake = { SDK_INT: 34, ping: () => 'pong', pingAsync: async (v: string) => `pong:${v}` };
  const svc = injectService(AlarmEngineService, {
    providers: [{ provide: AlarmEngineService.NATIVE, useValue: fake }],
  });
  expect(svc.isAvailable).toBe(true);
  expect(await svc.ping('x')).toBe('pong:x');
});

test('degrada con elegancia si el módulo no existe', async () => {
  const svc = injectService(AlarmEngineService, {
    providers: [{ provide: AlarmEngineService.NATIVE, useValue: null }],
  });
  expect(svc.isAvailable).toBe(false);
  expect(await svc.ping()).toBeNull();
});
