import { expect, test } from 'vitest';
import { nextOccurrence } from './recurrence.ts';
import { validateDraft } from './alarm-validation.ts';
import { compareAlarms, sortAlarms } from './alarm-sort.ts';
import { maskToWeekdays, weekdaysToMask, type Alarm, type AlarmDraft } from './alarm.model.ts';

const base: AlarmDraft = {
  label: '',
  enabled: true,
  type: 'once',
  hour: 7,
  minute: 30,
  date: null,
  weekdays: [],
  dayOfMonth: null,
  toneId: 'default',
  category: 'standard',
  tags: [],
};

test('mensual día 31: febrero se omite y suena en marzo', () => {
  const alarm = { ...base, type: 'monthly' as const, dayOfMonth: 31 };
  // 15 de febrero de 2027 (no bisiesto): el siguiente día 31 es el 31 de marzo.
  const next = nextOccurrence(alarm, new Date(2027, 1, 15, 12, 0));
  expect(next).toEqual(new Date(2027, 2, 31, 7, 30));
});

test('mensual día 31: abril (30 días) se omite y suena en mayo', () => {
  const alarm = { ...base, type: 'monthly' as const, dayOfMonth: 31 };
  expect(nextOccurrence(alarm, new Date(2027, 3, 1, 0, 0))).toEqual(new Date(2027, 4, 31, 7, 30));
});

test('mensual: si hoy ya pasó la hora, pasa al mes siguiente', () => {
  const alarm = { ...base, type: 'monthly' as const, dayOfMonth: 10 };
  expect(nextOccurrence(alarm, new Date(2027, 0, 10, 8, 0))).toEqual(new Date(2027, 1, 10, 7, 30));
});

test('semanal: elige el próximo día marcado', () => {
  // Lunes (0) y viernes (4). 2027-01-05 es martes -> próximo viernes 2027-01-08.
  const alarm = { ...base, type: 'weekly' as const, weekdays: [0, 4] as const };
  expect(nextOccurrence(alarm, new Date(2027, 0, 5, 9, 0))).toEqual(new Date(2027, 0, 8, 7, 30));
});

test('semanal: el mismo día cuenta si la hora aún no pasó', () => {
  const alarm = { ...base, type: 'weekly' as const, weekdays: [1] as const }; // martes
  expect(nextOccurrence(alarm, new Date(2027, 0, 5, 6, 0))).toEqual(new Date(2027, 0, 5, 7, 30));
});

test('una vez: fecha pasada devuelve null', () => {
  const alarm = { ...base, date: '2020-01-01' };
  expect(nextOccurrence(alarm, new Date(2027, 0, 1))).toBeNull();
});

test('validación por tipo', () => {
  const now = new Date(2027, 0, 1, 12, 0);
  expect(validateDraft({ ...base, type: 'weekly' }, now)).toHaveLength(1);
  expect(validateDraft({ ...base, type: 'monthly' }, now)).toHaveLength(1);
  expect(validateDraft({ ...base, date: '2027-02-01' }, now)).toHaveLength(0);
  expect(validateDraft({ ...base, date: '2026-01-01' }, now)).toHaveLength(1);
});

test('orden por hora, independiente de activa, con desempate estable', () => {
  const mk = (id: string, hour: number, minute: number, enabled: boolean, createdAt: number) =>
    ({ ...base, id, hour, minute, enabled, createdAt, updatedAt: createdAt }) as Alarm;
  const a = mk('a', 8, 0, false, 2);
  const b = mk('b', 7, 0, true, 3);
  const c = mk('c', 8, 0, true, 1);
  expect(sortAlarms([a, b, c]).map((x) => x.id)).toEqual(['b', 'c', 'a']);
  expect(compareAlarms(a, c)).toBeGreaterThan(0);
});

test('máscara de días ida y vuelta', () => {
  expect(maskToWeekdays(weekdaysToMask([0, 2, 6]))).toEqual([0, 2, 6]);
});
