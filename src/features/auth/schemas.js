import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .email('Enter a valid email address.');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.'),
});
