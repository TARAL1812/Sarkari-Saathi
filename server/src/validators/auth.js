import { z } from 'zod';

const email = z.string({ required_error: 'Email is required.' })
  .trim()
  .email('Enter a valid email address.')
  .max(254, 'Email is too long.');

const password = z.string({ required_error: 'Password is required.' })
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password must be 128 characters or fewer.')
  .regex(/[A-Za-z]/, 'Password must include at least one letter.')
  .regex(/[0-9]/, 'Password must include at least one number.');

export const registerSchema = z.object({
  name: z.string({ required_error: 'Name is required.' }).trim().min(2, 'Name must be at least 2 characters.').max(60, 'Name must be 60 characters or fewer.'),
  email,
  password,
}).strict();

export const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required.' }).trim().email('Enter a valid email address.'),
  password: z.string({ required_error: 'Password is required.' }).min(1, 'Password is required.'),
}).strict();

export const changePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'Current password is required.' }).min(1, 'Current password is required.'),
  newPassword: password,
}).strict();
