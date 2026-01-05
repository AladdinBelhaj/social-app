import axios from 'axios';

const GATEWAY_URL = 'http://localhost:8762/api';

const mcvClient = axios.create({
  baseURL: `${GATEWAY_URL}/mcv/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

const pubClient = axios.create({
  baseURL: `${GATEWAY_URL}/pub`,
  headers: {
    'Content-Type': 'application/json',
  },
});

const msgClient = axios.create({
  baseURL: `${GATEWAY_URL}/messaging`,
  headers: {
    'Content-Type': 'application/json',
  },
});

mcvClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

pubClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

msgClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: (payload: any) => mcvClient.post('/auth/register', payload).then(res => res.data),
  login: (payload: any) => mcvClient.post('/auth/login', payload).then(res => res.data),
  getProfile: () => mcvClient.get('/users/me').then(res => res.data),
  getUserById: (id: number | string) => mcvClient.get(`/users/${id}`).then(res => res.data),
  updateProfile: (updates: any) => mcvClient.put('/users/me', updates).then(res => res.data),
  clearSession: () => localStorage.removeItem('token'),
  saveToken: (token: string) => localStorage.setItem('token', token),
};

export const friendsApi = {
  listFriends: () => mcvClient.get('/friends').then(res => res.data),
  listPending: () => mcvClient.get('/friends/pending').then(res => res.data),
  listSent: () => mcvClient.get('/friends/sent').then(res => res.data),
  search: (username: string) => mcvClient.post('/friends/search', { username }).then(res => res.data),
  sendRequest: (friendId: number) => mcvClient.post('/friends/requests', { friendId }).then(res => res.data),
  acceptRequest: (requestId: number) => mcvClient.post(`/friends/requests/${requestId}/accept`).then(res => res.data),
  rejectRequest: (requestId: number) => mcvClient.delete(`/friends/requests/${requestId}`).then(res => res.data),
  removeFriend: (friendId: number) => mcvClient.delete(`/friends/${friendId}`).then(res => res.data),
};

export const publicationsApi = {
  list: () => pubClient.get('/publications').then(res => res.data),
  create: (formData: FormData) => pubClient.post('/publications', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(res => res.data),
  react: (id: string | number, type: string) => pubClient.post(`/publications/${id}/react`, { type }).then(res => res.data),
};

export const messagingApi = {
  getConversations: () => msgClient.get('/conversations/').then(res => res.data),
  getMessages: (conversationId: number) => msgClient.get(`/messages/${conversationId}`).then(res => res.data),
  sendMessage: (receiverId: number, content: string, receiverUsername?: string) => msgClient.post('/messages/', { receiver_id: receiverId, content, receiver_username: receiverUsername }).then(res => res.data),
  getUserByUsername: (username: string) => msgClient.get(`/users/username/${username}`).then(res => res.data),
};
