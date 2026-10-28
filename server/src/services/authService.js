import crypto from 'node:crypto';
import { httpError } from '../utils/httpError.js';
import { hashPassword, verifyAgainstDummy, verifyPassword } from '../utils/passwords.js';
import { parseOrThrow } from '../utils/validation.js';
import { changePasswordSchema, loginSchema, registerSchema } from '../validators/auth.js';
import { createSession, deleteExpiredSessions, deleteSession, deleteUserSessions } from '../repositories/sessionRepository.js';
import {
  createUser,
  findUserByEmail,
  findUserById,
  recordSuccessfulLogin,
  setTemporaryPassword,
  toPublicUser,
  updatePassword,
} from '../repositories/userRepository.js';

export function startSession(user) {
  deleteExpiredSessions();
  return createSession(user.id);
}

export async function registerUser(body) {
  const { name, email, password } = parseOrThrow(registerSchema, body);
  if (findUserByEmail(email)) {
    throw httpError(409, 'EMAIL_TAKEN', 'An account with that email already exists.', {
      fields: { email: 'An account with that email already exists.' },
    });
  }
  const passwordHash = await hashPassword(password);
  try {
    const user = createUser({ name, email, passwordHash, role: 'user' });
    return { user: toPublicUser(user), session: startSession(user) };
  } catch (error) {
    if (String(error.code).startsWith('SQLITE_CONSTRAINT')) {
      throw httpError(409, 'EMAIL_TAKEN', 'An account with that email already exists.', {
        fields: { email: 'An account with that email already exists.' },
      });
    }
    throw error;
  }
}

export async function loginUser(body) {
  const { email, password } = parseOrThrow(loginSchema, body);
  const user = findUserByEmail(email);
  const valid = user ? await verifyPassword(password, user.password_hash) : await verifyAgainstDummy(password);
  if (!user || !valid) {
    throw httpError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }
  const loggedInUser = recordSuccessfulLogin(user.id);
  return { user: toPublicUser(loggedInUser), session: startSession(loggedInUser) };
}

export function logoutUser(token) {
  deleteSession(token);
}

export async function changeUserPassword(userId, body) {
  const { currentPassword, newPassword } = parseOrThrow(changePasswordSchema, body);
  const user = findUserById(userId);
  const valid = await verifyPassword(currentPassword, user.password_hash);
  if (!valid) {
    throw httpError(400, 'INVALID_PASSWORD', 'Current password is incorrect.', {
      fields: { currentPassword: 'Current password is incorrect.' },
    });
  }
  updatePassword(userId, await hashPassword(newPassword));
  deleteUserSessions(userId);
  const refreshed = findUserById(userId);
  return { user: toPublicUser(refreshed), session: startSession(refreshed) };
}

export async function resetUserPasswordAsAdmin(adminId, targetUserId, body) {
  const { currentPassword } = parseOrThrow(changePasswordSchema.pick({ currentPassword: true }), body);
  const admin = findUserById(adminId);
  if (!admin || admin.role !== 'admin' || !(await verifyPassword(currentPassword, admin.password_hash))) {
    throw httpError(401, 'ADMIN_CONFIRMATION_FAILED', 'Administrator password confirmation failed.');
  }
  const target = findUserById(targetUserId);
  if (!target) throw httpError(404, 'NOT_FOUND', 'That account was not found.');

  let temporaryPassword;
  do {
    temporaryPassword = crypto.randomBytes(18).toString('base64url');
  } while (!/[A-Za-z]/.test(temporaryPassword) || !/[0-9]/.test(temporaryPassword));

  setTemporaryPassword(target.id, await hashPassword(temporaryPassword));
  deleteUserSessions(target.id);
  return { email: target.email, temporaryPassword };
}
