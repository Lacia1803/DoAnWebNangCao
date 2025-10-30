const { hashInternalCode, compareInternalCode } = require('../../../backend_library/utils/internalCode');

describe('internalCode utils', () => {
  test('compare plaintext default when no stored value', async () => {
    expect(await compareInternalCode('1836', null)).toBe(true);
    expect(await compareInternalCode('0000', null)).toBe(false);
  });

  test('hash and compare works for correct and incorrect values', async () => {
    const plain = 'my-secret-123';
    const hashed = await hashInternalCode(plain);
    expect(typeof hashed).toBe('string');
    expect(hashed.length).toBeGreaterThan(10);

    const ok = await compareInternalCode(plain, hashed);
    expect(ok).toBe(true);

    const bad = await compareInternalCode('wrong', hashed);
    expect(bad).toBe(false);
  });
});
