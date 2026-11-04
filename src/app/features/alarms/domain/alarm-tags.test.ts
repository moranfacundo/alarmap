import { describe, expect, test } from 'vitest';
import { MAX_TAGS, MAX_TAG_LENGTH, addTag, type AlarmDraft } from './alarm.model.ts';
import { validateDraft } from './alarm-validation.ts';

describe('addTag', () => {
  test('recorta y colapsa espacios', () => {
    expect(addTag([], '  x1   Aciclovir ')).toEqual(['x1 Aciclovir']);
  });
  test('ignora vacío y duplicados sin distinguir mayúsculas', () => {
    expect(addTag(['x1 Aciclovir'], '   ')).toEqual(['x1 Aciclovir']);
    expect(addTag(['x1 Aciclovir'], 'X1 aciclovir')).toEqual(['x1 Aciclovir']);
  });
  test('respeta máximos', () => {
    const full = Array.from({ length: MAX_TAGS }, (_, i) => `t${i}`);
    expect(addTag(full, 'otro')).toBe(full);
    expect(addTag([], 'a'.repeat(MAX_TAG_LENGTH + 5))[0]).toHaveLength(MAX_TAG_LENGTH);
  });
});

describe('validateDraft · rutina', () => {
  const base: AlarmDraft = {
    label: '',
    enabled: true,
    type: 'weekly',
    hour: 10,
    minute: 0,
    date: null,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    dayOfMonth: null,
    toneId: 'default',
    category: 'routine',
    tags: ['x1 Aciclovir', 'x1 levofloxacina'],
  };
  test('válida con tokens', () => {
    expect(validateDraft(base)).toEqual([]);
  });
  test('exige al menos un token', () => {
    expect(validateDraft({ ...base, tags: [] })).toContain(
      'Agrega al menos un medicamento o tarea.',
    );
  });
});
