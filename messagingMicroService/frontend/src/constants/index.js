/**
 * Constants used throughout the application
 * Centralized for easy modification
 */

// Message Status
export const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
};

// WebSocket Status
export const WS_STATUS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  CLOSING: 'closing',
};

// Message Types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  AUDIO: 'audio',
  VIDEO: 'video',
  SYSTEM: 'system',
};

// WebSocket Event Types
export const WS_EVENT_TYPES = {
  NEW_MESSAGE: 'new_message',
  MESSAGE_STATUS: 'message_status',
  USER_TYPING: 'user_typing',
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  CONNECTION_ESTABLISHED: 'connection_established',
};

// UI Constants
export const UI = {
  MAX_MESSAGE_LENGTH: 5000,
  MESSAGES_PER_PAGE: 50,
  CONVERSATION_REFRESH_INTERVAL: 30000, // 30 seconds
  TYPING_INDICATOR_TIMEOUT: 3000, // 3 seconds
  AUTO_SCROLL_THRESHOLD: 100, // pixels from bottom
};

// API Endpoints
export const API_ENDPOINTS = {
  USERS: '/users/',
  USER_BY_ID: (id) => `/users/${id}`,
  MESSAGES: '/messages/',
  CONVERSATIONS: (userId) => `/conversations/${userId}`,
  CONVERSATION_MESSAGES: (convId, userId) => `/messages/${convId}?user_id=${userId}`,
  WEBSOCKET: (userId) => `/ws/${userId}`,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_ERROR: 'Authentication failed. Please log in again.',
  MESSAGE_SEND_FAILED: 'Failed to send message. Please try again.',
  LOAD_CONVERSATIONS_FAILED: 'Failed to load conversations.',
  LOAD_MESSAGES_FAILED: 'Failed to load messages.',
  WEBSOCKET_ERROR: 'Real-time connection error.',
  USER_NOT_FOUND: 'User not found.',
  INVALID_INPUT: 'Invalid input. Please check your data.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  MESSAGE_SENT: 'Message sent successfully',
  USER_CREATED: 'User created successfully',
  CONNECTION_ESTABLISHED: 'Connected to messaging service',
};

// Color Palette
export const COLORS = {
  PRIMARY: '#667eea',
  PRIMARY_DARK: '#5568d3',
  SECONDARY: '#764ba2',
  SUCCESS: '#4caf50',
  ERROR: '#f44336',
  WARNING: '#ff9800',
  INFO: '#2196f3',
  TEXT_PRIMARY: '#333333',
  TEXT_SECONDARY: '#666666',
  TEXT_DISABLED: '#999999',
  BACKGROUND: '#f5f5f5',
  SURFACE: '#ffffff',
  BORDER: '#e0e0e0',
};

// Keyboard Shortcuts
export const KEYBOARD = {
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
};

// LocalStorage Keys
export const STORAGE_KEYS = {
  USER_ID: 'messaging_user_id',
  USERNAME: 'messaging_username',
  THEME: 'messaging_theme',
  NOTIFICATIONS_ENABLED: 'messaging_notifications',
  LAST_CONVERSATION: 'messaging_last_conversation',
};

// Regex Patterns
export const PATTERNS = {
  URL: /(https?:\/\/[^\s]+)/g,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  MENTION: /@\w+/g,
  HASHTAG: /#\w+/g,
};

// Feature Flags
export const FEATURES = {
  FILE_UPLOAD: false,
  VOICE_MESSAGES: false,
  VIDEO_CALLS: false,
  GROUP_CHATS: false,
  MESSAGE_REACTIONS: false,
  TYPING_INDICATORS: false,
  READ_RECEIPTS: true,
  NOTIFICATIONS: true,
  EMOJI_PICKER: false,
};

// Animation Durations (ms)
export const ANIMATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

export default {
  MESSAGE_STATUS,
  WS_STATUS,
  MESSAGE_TYPES,
  WS_EVENT_TYPES,
  UI,
  API_ENDPOINTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  COLORS,
  KEYBOARD,
  STORAGE_KEYS,
  PATTERNS,
  FEATURES,
  ANIMATIONS,
};
