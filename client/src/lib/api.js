const API_BASE = import.meta.env?.VITE_API_BASE || '';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorInfo = payload?.error || {};
    const err = new Error(errorInfo.message || `Request failed with status ${response.status}`);
    err.status = response.status;
    err.code = errorInfo.code;
    err.details = errorInfo.details;
    throw err;
  }

  return payload?.data;
}

export const api = {
  // Health
  health: () => request('/api/health'),

  // Catalog
  getCategories: () => request('/api/categories'),
  getJourneys: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set('category', params.category);
    if (params.q) qs.set('q', params.q);
    const query = qs.toString();
    return request(`/api/journeys${query ? `?${query}` : ''}`);
  },
  getJourney: (id) => request(`/api/journeys/${encodeURIComponent(id)}`),
  getJourneySteps: (id) => request(`/api/journeys/${encodeURIComponent(id)}/steps`),
  getJourneyDocuments: (id) => request(`/api/journeys/${encodeURIComponent(id)}/documents`),
  getJourneyBranches: (id) => request(`/api/journeys/${encodeURIComponent(id)}/branches`),

  // Auth
  register: (data) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (credentials) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request('/api/auth/me'),
  changePassword: (data) => request('/api/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),

  // User Journeys
  getUserJourneys: () => request('/api/me/journeys'),
  getUserJourney: (id) => request(`/api/me/journeys/${encodeURIComponent(id)}`),
  createUserJourney: (data) => request('/api/me/journeys', { method: 'POST', body: JSON.stringify(data) }),
  deleteUserJourney: (id) => request(`/api/me/journeys/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  restoreUserJourney: (id) => request(`/api/me/journeys/${encodeURIComponent(id)}/restore`, { method: 'POST' }),
  patchProgress: (id, { stepId, completed }) => request(`/api/me/journeys/${encodeURIComponent(id)}/progress`, {
    method: 'PATCH',
    body: JSON.stringify({ stepId, completed }),
  }),
  patchChecklist: (id, payload = {}) => {
    const body = Array.isArray(payload.items)
      ? { items: payload.items }
      : {
          documentName: payload.documentName,
          completed: payload.completed ?? payload.checked,
        };

    return request(`/api/me/journeys/${encodeURIComponent(id)}/checklist`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  // Living Abroad Settings
  getAbroad: () => request('/api/me/abroad'),
  putAbroad: (data) => request('/api/me/abroad', { method: 'PUT', body: JSON.stringify(data) }),

  // Requests
  getUserRequests: () => request('/api/me/requests'),
  createUserRequest: (data) => request('/api/me/requests', { method: 'POST', body: JSON.stringify(data) }),
  getUserRequest: (id) => request(`/api/me/requests/${encodeURIComponent(id)}`),

  // Admin
  getAdminUserOverview: () => request('/api/admin/users/overview'),
  resetAdminUserPassword: (userId, currentPassword) => request(
    `/api/admin/users/${encodeURIComponent(userId)}/temporary-password`,
    { method: 'POST', body: JSON.stringify({ currentPassword }) },
  ),
  deleteAdminUser: (userId) => request(`/api/admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE' }),
  getAdminJourneys: () => request('/api/admin/journeys'),
  getAdminJourney: (id) => request(`/api/admin/journeys/${encodeURIComponent(id)}`),
  createAdminJourney: (data) => request('/api/admin/journeys', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminJourney: (id, data) => request(`/api/admin/journeys/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  setAdminJourneyStatus: (id, status) => request(`/api/admin/journeys/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  deleteAdminJourney: (id) => request(`/api/admin/journeys/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getAdminCategories: () => request('/api/admin/categories'),
  createAdminCategory: (data) => request('/api/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminCategory: (id, data) => request(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteAdminCategory: (id) => request(`/api/admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getAdminRequests: (status) => request(`/api/admin/requests${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  updateAdminRequest: (id, data) => request(`/api/admin/requests/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
};
