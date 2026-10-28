import { beforeEach, describe, expect, it } from 'vitest';
import { login } from '@/features/auth/auth.api';
import { db } from '@/mocks/db';
import { seededUsers } from '@/mocks/seed';
import { ROLES } from '@/lib/constants';

describe('mock authentication API', () => {
  beforeEach(() => {
    db.users.splice(0, db.users.length, ...seededUsers);
  });

  it('authenticates both seeded demo roles without exposing passwords', async () => {
    const schoolUser = await login({
      email: 'school@demo.com',
      password: 'demo123',
    });
    const branchUser = await login({
      email: 'branch@demo.com',
      password: 'demo123',
    });

    expect(schoolUser.role).toBe(ROLES.SCHOOL_ADMIN);
    expect(branchUser.role).toBe(ROLES.BRANCH_ADMIN);
    expect(branchUser.branchId).toBe('branch-demo');
    expect(schoolUser).not.toHaveProperty('password');
  });

  it('rejects incorrect credentials with the standard app error', async () => {
    await expect(
      login({ email: 'school@demo.com', password: 'incorrect' }),
    ).rejects.toMatchObject({
      name: 'AppError',
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('rejects malformed email input before authenticating', async () => {
    await expect(login({ email: 'not-an-email', password: 'demo123' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });
});
