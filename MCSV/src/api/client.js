const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const getToken = () => localStorage.getItem('token');

const request = async (path, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Request failed';
    throw new Error(message);
  }

  return data;
};

export const authApi = {
  register: (payload) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  login: (payload) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getProfile: () => request('/users/me'),
  updateProfile: (updates) => request('/users/me', {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  clearSession: () => localStorage.removeItem('token'),
  saveToken: (token) => localStorage.setItem('token', token),
};

export const friendsApi = {
  listFriends: () => request('/friends'),
  listPending: () => request('/friends/pending'),
  listSent: () => request('/friends/sent'),
  search: (username) => request('/friends/search', {
    method: 'POST',
    body: JSON.stringify({ username }),
  }),
  sendRequest: (friendId) => request('/friends/requests', {
    method: 'POST',
    body: JSON.stringify({ friendId }),
  }),
  acceptRequest: (requestId) => request(`/friends/requests/${requestId}/accept`, {
    method: 'POST',
  }),
  rejectRequest: (requestId) => request(`/friends/requests/${requestId}`, {
    method: 'DELETE',
  }),
  removeFriend: (friendId) => request(`/friends/${friendId}`, {
    method: 'DELETE',
  }),
};

