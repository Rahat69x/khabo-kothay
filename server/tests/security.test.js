import { describe, it, expect } from 'vitest';
import { runSecurityCheck } from '../../scripts/security-check.js';

describe('Automated Security Audit & Credential Protection', () => {
  it('Validates that no Google API keys, server secrets, or .env files appear in client or build files', () => {
    const res = runSecurityCheck();
    expect(res.violations).toEqual([]);
    expect(res.success).toBe(true);
  });
});
