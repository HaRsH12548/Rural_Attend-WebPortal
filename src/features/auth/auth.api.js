import { db } from '@/mocks/db';
import { simulate } from '@/mocks/delay';
import { AppError } from '@/lib/errors';
import { loginSchema } from '@/features/auth/schemas';

/**
 * Authenticates a user against the in-memory demo accounts.
 * @param {{ email: string, password: string }} credentials Login credentials.
 * @returns {Promise<import('@/models/people').User>} The authenticated public user.
 */
export async function login(credentials) {
  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'Check your email and password.',
    });
  }

  return simulate(() => {
    const email = parsed.data.email.toLowerCase();
    const match = db.users.find(
      (user) => user.email.toLowerCase() === email && user.password === parsed.data.password,
    );

    if (!match) {
      throw new AppError({
        code: 'INVALID_CREDENTIALS',
        message: 'That email and password combination was not recognized.',
      });
    }

    return toPublicUser(match);
  });
}

/**
 * Removes mock-only credentials from a user before returning it to the UI.
 * @param {typeof db.users[number]} user Mock database user.
 * @returns {import('@/models/people').User} The user without credentials.
 */
function toPublicUser(user) {
  const { password, ...publicUser } = user;
  void password;
  return publicUser;
}
