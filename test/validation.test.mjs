import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  normalizeUsername,
  emailSchema,
  passwordSchema,
  signupSchema,
  loginSchema,
  createGroupSchema,
  createMessageSchema,
} from '../src/lib/validation.ts';

describe('GENZOKU Core Validation Tests', () => {
  it('should normalize usernames properly', () => {
    assert.strictEqual(normalizeUsername('  @Kenji_Dev  '), 'kenji_dev');
    assert.strictEqual(normalizeUsername('AoiSora'), 'aoisora');
  });

  it('should validate valid email addresses', () => {
    assert.strictEqual(emailSchema.safeParse('user@genzoku.app').success, true);
    assert.strictEqual(emailSchema.safeParse('invalid-email').success, false);
  });

  it('should validate strong passwords', () => {
    assert.strictEqual(passwordSchema.safeParse('Genzoku2026!').success, true);
    assert.strictEqual(passwordSchema.safeParse('weak').success, false);
    assert.strictEqual(passwordSchema.safeParse('nouppercase123').success, false);
  });

  it('should enforce password confirmation in signup', () => {
    const validSignup = {
      email: 'kenji@genzoku.app',
      displayName: 'Kenji Sato',
      username: 'kenji_dev',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    };
    assert.strictEqual(signupSchema.safeParse(validSignup).success, true);

    const mismatchedSignup = {
      ...validSignup,
      confirmPassword: 'DifferentPassword123!',
    };
    const result = signupSchema.safeParse(mismatchedSignup);
    assert.strictEqual(result.success, false);
  });

  it('should reject groups with empty member lists', () => {
    const emptyGroup = {
      name: 'Alpha Team',
      description: 'Test group',
      memberIds: [],
    };
    assert.strictEqual(createGroupSchema.safeParse(emptyGroup).success, false);
  });
});
