import { toPublicUser } from '../repositories/userRepository.js';
import { changeUserPassword, loginUser, logoutUser, registerUser } from '../services/authService.js';
import { clearSessionCookie, setSessionCookie } from '../middleware/auth.js';

function attachSession(res, session) {
  setSessionCookie(res, session.token, session.expiresAt);
}

export async function register(req, res) {
  const { user, session } = await registerUser(req.body);
  attachSession(res, session);
  res.status(201).json({ data: { user } });
}

export async function login(req, res) {
  const { user, session } = await loginUser(req.body);
  attachSession(res, session);
  res.json({ data: { user } });
}

export function logout(req, res) {
  logoutUser(req.sessionToken);
  clearSessionCookie(res);
  res.json({ data: { ok: true } });
}

export function me(req, res) {
  res.json({ data: { user: toPublicUser(req.user) } });
}

export async function changePassword(req, res) {
  const { user, session } = await changeUserPassword(req.user.id, req.body);
  attachSession(res, session);
  res.json({ data: { user } });
}
