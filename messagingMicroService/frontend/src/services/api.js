/**
 * API Service for Messaging Microservice (TEST CLIENT)
 * 
 * In DEV_MODE, uses X-User-ID and X-Username headers for auth.
 * In production, would use JWT tokens from Auth Service.
 */

import config from '../config';

const API_URL = config.API_BASE_URL;

// Store current user for auth headers
let currentUser = null;

export const setCurrentUser = (user) => {
  currentUser = user;
};

export const clearCurrentUser = () => {
  currentUser = null;
};

const getAuthHeaders = () => {
  if (!currentUser) return {};
  
  // DEV MODE: Use header-based auth
  if (config.DEV_MODE) {
    return {
      'X-User-ID': String(currentUser.id),
      'X-Username': currentUser.username,
    };
  }
  
  // PRODUCTION: Would use JWT token
  // return { 'Authorization': `Bearer ${currentUser.token}` };
  return {};
};

const fetchAPI = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

export const userAPI = {
  createUser: async (username) => {
    return fetchAPI('/users/', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  },

  getUser: async (userId) => {
    return fetchAPI(`/users/${userId}`);
  },

  getUserByUsername: async (username) => {
    return fetchAPI(`/users/username/${username}`);
  },
};

export const messageAPI = {
  sendMessage: async (receiverId, content) => {
    // Auth headers provide sender identity
    return fetchAPI('/messages/', {
      method: 'POST',
      body: JSON.stringify({
        receiver_id: receiverId,
        content,
      }),
    });
  },

  getMessages: async (conversationId) => {
    // Auth headers provide user identity
    return fetchAPI(`/messages/${conversationId}`);
  },
};

export const conversationAPI = {
  getUserConversations: async () => {
    // Auth headers provide user identity
    return fetchAPI('/conversations/');
  },
};

const api = {
  user: userAPI,
  message: messageAPI,
  conversation: conversationAPI,
  setCurrentUser,
  clearCurrentUser,
};

export default api;
