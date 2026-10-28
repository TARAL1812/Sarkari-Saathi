import crypto from 'node:crypto';

export const newId = (prefix) => (prefix ? `${prefix}_${crypto.randomUUID()}` : crypto.randomUUID());

export const nowIso = () => new Date().toISOString();
