const { isValidTarget } = require('../middleware/validateTarget');

describe('isValidTarget', () => {
  test('accepts a plain hostname', () => {
    expect(isValidTarget('scanme.nmap.org')).toBe(true);
  });

  test('accepts an IPv4 address', () => {
    expect(isValidTarget('127.0.0.1')).toBe(true);
  });

  test('rejects a URL with a protocol', () => {
    expect(isValidTarget('https://scanme.nmap.org')).toBe(false);
  });

  test('rejects shell metacharacters (command injection attempt)', () => {
    expect(isValidTarget('scanme.nmap.org; rm -rf /')).toBe(false);
    expect(isValidTarget('$(whoami)')).toBe(false);
    expect(isValidTarget('target && curl evil.com')).toBe(false);
  });

  test('rejects empty or non-string input', () => {
    expect(isValidTarget('')).toBe(false);
    expect(isValidTarget(null)).toBe(false);
    expect(isValidTarget(undefined)).toBe(false);
  });

  test('rejects overly long input', () => {
    expect(isValidTarget('a'.repeat(300))).toBe(false);
  });
});
