import { httpError } from './httpError.js';

export function isHttpUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function fieldsFromZod(error) {
  const fields = {};
  for (const issue of error.issues || []) {
    const path = issue.path.map((part) => String(part)).join('.');
    if (path && !fields[path]) fields[path] = issue.message;
  }
  return fields;
}

export function parseOrThrow(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (result.success) return result.data;
  throw httpError(400, 'VALIDATION_ERROR', 'Please fix the highlighted fields.', {
    fields: fieldsFromZod(result.error),
  });
}
