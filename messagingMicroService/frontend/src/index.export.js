/**
 * Component Index - Export all components for easy importing
 * Makes it simple to import into larger projects
 */

// Main App
export { default as MessagingApp } from './components/MessagingApp';

// Individual Components
export { default as ConversationList } from './components/ConversationList';
export { default as MessageThread } from './components/MessageThread';
export { default as MessageInput } from './components/MessageInput';
export { default as UserSelector } from './components/UserSelector';

// Context
export { MessagingProvider, useMessaging } from './context/MessagingContext';

// Custom Hooks
export {
  useWebSocket,
  useConversations,
  useMessages,
  useAutoScroll,
  useDebounce,
  useLocalStorage,
} from './hooks/useMessaging';

// Services
export { default as api } from './services/api';
export { default as websocketService } from './services/websocket';

// Utilities
export { default as helpers } from './utils/helpers';

// Constants
export { default as constants } from './constants';

// Configuration
export { default as config } from './config';
