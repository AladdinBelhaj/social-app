import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setCurrentUser as setApiUser, clearCurrentUser as clearApiUser } from '../services/api';
import websocketService from '../services/websocket';

const MessagingContext = createContext();

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within MessagingProvider');
  }
  return context;
};

export const MessagingProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [newChatTarget, setNewChatTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [wsStatus, setWsStatus] = useState('disconnected');

  const login = useCallback(async (username, isExistingUser = false) => {
    setLoading(true);
    setError(null);
    try {
      let user;
      
      if (isExistingUser) {
        user = await api.user.getUserByUsername(username);
        if (!user) {
          throw new Error(`User "${username}" not found`);
        }
      } else {
        try {
          user = await api.user.createUser(username);
        } catch (createError) {
          if (createError.message.includes('UNIQUE constraint')) {
            user = await api.user.getUserByUsername(username);
            if (!user) {
              throw new Error('User exists but could not be retrieved');
            }
          } else {
            throw createError;
          }
        }
      }
      
      // Set user for API auth headers
      setApiUser(user);
      setCurrentUser(user);
      setIsAuthenticated(true);
      websocketService.connect(user.id);
      
      // Load conversations
      await loadConversations();
      
      return user;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    websocketService.disconnect();
    clearApiUser();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setConversations([]);
    setActiveConversation(null);
    setMessages([]);
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const convs = await api.conversation.getUserConversations();
      setConversations(convs);
      return convs;
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(err.message);
      return [];
    }
  }, []);

  const startNewChat = useCallback(async (username) => {
    try {
      if (!currentUser) {
        throw new Error('Not logged in');
      }
      
      const targetUser = await api.user.getUserByUsername(username);
      
      if (!targetUser) {
        throw new Error(`User "${username}" not found`);
      }
      
      const existingConv = conversations.find(conv => {
        const otherUserId = conv.participant_1_id === currentUser.id 
          ? conv.participant_2_id 
          : conv.participant_1_id;
        return otherUserId === targetUser.id;
      });
      
      if (existingConv) {
        setActiveConversation(existingConv.id);
        setNewChatTarget(null);
        return {
          success: true,
          existingConversation: true,
          conversationId: existingConv.id,
          user: targetUser
        };
      }
      
      setNewChatTarget(targetUser);
      setActiveConversation(null);
      setMessages([]);
      
      return {
        success: true,
        existingConversation: false,
        user: targetUser
      };
    } catch (err) {
      console.error('Error starting new chat:', err);
      return {
        success: false,
        message: err.message || 'Failed to find user'
      };
    }
  }, [conversations, currentUser]);

  const loadMessages = useCallback(async (conversationId) => {
    if (!currentUser) return;
    
    setLoading(true);
    setNewChatTarget(null);
    try {
      const msgs = await api.message.getMessages(conversationId);
      setMessages(msgs);
      setActiveConversation(conversationId);
      return msgs;
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const sendMessage = useCallback(async (receiverId, content) => {
    if (!currentUser || !content.trim()) return;

    try {
      const message = await api.message.sendMessage(receiverId, content);
      
      // Add message to local state if it's in the active conversation
      if (message.conversation_id === activeConversation) {
        setMessages(prev => [...prev, message]);
      }
      
      // If this was a new chat, switch to the conversation
      if (newChatTarget && newChatTarget.id === receiverId) {
        setNewChatTarget(null);
        setActiveConversation(message.conversation_id);
      }
      
      // Refresh conversations to update last message
      await loadConversations();
      
      return message;
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message);
      throw err;
    }
  }, [currentUser, activeConversation, newChatTarget, loadConversations]);

  useEffect(() => {
    const unsubscribeMessage = websocketService.onMessage((data) => {
      console.log('Received WebSocket message:', data);
      
      if (data.type === 'new_message') {
        const message = data.message;
        
        // Add to messages if it's in the active conversation
        if (message.conversation_id === activeConversation) {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === message.id)) {
              return prev;
            }
            return [...prev, message];
          });
        }
        
        // Refresh conversations
        if (currentUser) {
          loadConversations();
        }
      } else if (data.type === 'user_status') {
        // Handle user online/offline status
        if (data.status === 'online') {
          setOnlineUsers(prev => [...new Set([...prev, data.user_id])]);
        } else if (data.status === 'offline') {
          setOnlineUsers(prev => prev.filter(id => id !== data.user_id));
        }
      } else if (data.type === 'online_users') {
        // Initial list of online users
        setOnlineUsers(data.users || []);
      }
    });

    const unsubscribeStatus = websocketService.onStatusChange((status) => {
      setWsStatus(status);
    });

    return () => {
      unsubscribeMessage();
      unsubscribeStatus();
    };
  }, [activeConversation, currentUser, loadConversations]);

  /**
   * Refresh conversations periodically
   */
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      loadConversations();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [currentUser, loadConversations]);

  const value = {
    // User state
    currentUser,
    isAuthenticated,
    login,
    logout,

    // Conversations and messages
    conversations,
    activeConversation,
    messages,
    loadConversations,
    loadMessages,
    sendMessage,
    startNewChat,
    
    // New chat
    newChatTarget,

    // Online users
    onlineUsers,

    // UI state
    loading,
    error,
    wsStatus,
    setError,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};

export default MessagingContext;
