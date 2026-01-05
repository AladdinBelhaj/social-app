/**
 * Utility Functions for Messaging App
 * Helper functions that can be reused across components
 */

/**
 * Format timestamp to readable format
 * @param {string|Date} timestamp - Timestamp to format
 * @param {string} format - Format type ('time', 'date', 'datetime', 'relative')
 * @returns {string} Formatted time string
 */
export const formatTimestamp = (timestamp, format = 'time') => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (format === 'relative') {
    // Less than 1 minute
    if (diff < 60000) return 'Just now';
    // Less than 1 hour
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    // Less than 24 hours
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    // Less than 7 days
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    // Otherwise return date
    return formatTimestamp(timestamp, 'date');
  }

  if (format === 'time') {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (format === 'date') {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  }

  if (format === 'datetime') {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toISOString();
};

/**
 * Group messages by date
 * @param {Array} messages - Array of messages
 * @returns {Object} Messages grouped by date
 */
export const groupMessagesByDate = (messages) => {
  return messages.reduce((groups, message) => {
    const date = new Date(message.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});
};

/**
 * Get initials from username
 * @param {string} username - Username
 * @returns {string} Initials (max 2 characters)
 */
export const getInitials = (username) => {
  if (!username) return '?';
  
  const parts = username.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  
  return username.substring(0, 2).toUpperCase();
};

/**
 * Generate random color for user avatar
 * @param {string|number} seed - Seed for color generation
 * @returns {string} CSS color string
 */
export const generateAvatarColor = (seed) => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  ];

  const index = typeof seed === 'string'
    ? seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    : seed % colors.length;

  return colors[index];
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Validate message content
 * @param {string} content - Message content
 * @returns {Object} Validation result { valid: boolean, error: string }
 */
export const validateMessage = (content) => {
  if (!content || !content.trim()) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (content.length > 5000) {
    return { valid: false, error: 'Message is too long (max 5000 characters)' };
  }

  return { valid: true, error: null };
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Check if user is online (mock - can be extended)
 * @param {number} userId - User ID
 * @param {Array} onlineUsers - Array of online user IDs
 * @returns {boolean} Whether user is online
 */
export const isUserOnline = (userId, onlineUsers = []) => {
  return onlineUsers.includes(userId);
};

/**
 * Play notification sound
 */
export const playNotificationSound = () => {
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=');
    audio.play().catch(err => console.log('Could not play sound:', err));
  } catch (err) {
    console.log('Notification sound not available:', err);
  }
};

/**
 * Request notification permission
 * @returns {Promise<string>} Permission status
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
};

/**
 * Show browser notification
 * @param {string} title - Notification title
 * @param {Object} options - Notification options
 */
export const showNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/logo192.png',
      badge: '/logo192.png',
      ...options,
    });
  }
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

/**
 * Detect URLs in text and make them clickable
 * @param {string} text - Text to process
 * @returns {Array} Array of text and link elements
 */
export const linkifyText = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, index) => {
    if (part.match(urlRegex)) {
      return { type: 'link', content: part, key: index };
    }
    return { type: 'text', content: part, key: index };
  });
};

/**
 * Sanitize user input (basic)
 * @param {string} input - User input
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (!input) return '';
  
  // Remove script tags and dangerous attributes
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/on\w+='[^']*'/g, '')
    .trim();
};

export default {
  formatTimestamp,
  groupMessagesByDate,
  getInitials,
  generateAvatarColor,
  truncateText,
  validateMessage,
  formatFileSize,
  isUserOnline,
  playNotificationSound,
  requestNotificationPermission,
  showNotification,
  copyToClipboard,
  linkifyText,
  sanitizeInput,
};
