/**
 * Custom Hooks for Messaging
 * Reusable hooks that can be used in larger projects
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import websocketService from '../services/websocket';

/**
 * Hook for managing WebSocket connection
 * @param {number} userId - User ID to connect as
 * @returns {Object} WebSocket status and methods
 */
export const useWebSocket = (userId) => {
  const [status, setStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    if (!userId) return;

    // Connect to WebSocket
    websocketService.connect(userId);

    // Listen for messages
    const unsubscribeMessage = websocketService.onMessage((data) => {
      setLastMessage(data);
    });

    // Listen for status changes
    const unsubscribeStatus = websocketService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    // Cleanup on unmount
    return () => {
      unsubscribeMessage();
      unsubscribeStatus();
      websocketService.disconnect();
    };
  }, [userId]);

  return {
    status,
    lastMessage,
    isConnected: status === 'connected',
    send: (data) => websocketService.send(data),
  };
};

/**
 * Hook for fetching and managing conversations
 * @param {number} userId - User ID
 * @returns {Object} Conversations data and methods
 */
export const useConversations = (userId) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadConversations = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const convs = await api.conversation.getUserConversations(userId);
      setConversations(convs);
      return convs;
    } catch (err) {
      setError(err.message);
      console.error('Error loading conversations:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    loading,
    error,
    reload: loadConversations,
  };
};

/**
 * Hook for managing messages in a conversation
 * @param {number} conversationId - Conversation ID
 * @param {number} userId - Current user ID
 * @returns {Object} Messages data and methods
 */
export const useMessages = (conversationId, userId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadMessages = useCallback(async () => {
    if (!conversationId || !userId) return;

    setLoading(true);
    setError(null);
    try {
      const msgs = await api.message.getMessages(conversationId, userId);
      setMessages(msgs);
      return msgs;
    } catch (err) {
      setError(err.message);
      console.error('Error loading messages:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [conversationId, userId]);

  const sendMessage = useCallback(async (receiverId, content) => {
    if (!userId || !content.trim()) return;

    try {
      const message = await api.message.sendMessage(userId, receiverId, content);
      setMessages(prev => [...prev, message]);
      return message;
    } catch (err) {
      setError(err.message);
      console.error('Error sending message:', err);
      throw err;
    }
  }, [userId]);

  const addMessage = useCallback((message) => {
    setMessages(prev => {
      // Avoid duplicates
      if (prev.some(m => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    addMessage,
    reload: loadMessages,
  };
};

/**
 * Hook for auto-scrolling to bottom
 * Useful for message threads
 * @param {Array} dependencies - Dependencies that trigger scroll
 * @returns {Object} Ref to attach to scroll target
 */
export const useAutoScroll = (dependencies = []) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return scrollRef;
};

/**
 * Hook for debouncing values
 * Useful for search inputs
 * @param {*} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {*} Debounced value
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for local storage state
 * @param {string} key - Storage key
 * @param {*} initialValue - Initial value
 * @returns {Array} [value, setValue]
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};
