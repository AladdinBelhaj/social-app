/**
 * Configuration file for the messaging application (TEST CLIENT)
 * This frontend is for testing the messaging microservice only.
 */

const config = {
  // API Configuration (with messaging service prefix)
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/messaging',
  
  // WebSocket Configuration
  WS_BASE_URL: process.env.REACT_APP_WS_URL || 'ws://localhost:8000/api/messaging',
  
  // Dev Mode - enables header-based auth for testing
  DEV_MODE: process.env.REACT_APP_DEV_MODE !== 'false',
  
  // Application Settings
  MESSAGE_POLL_INTERVAL: 5000, // milliseconds
  RECONNECT_INTERVAL: 3000, // milliseconds
  MAX_RECONNECT_ATTEMPTS: 5,
  
  // UI Settings
  MESSAGES_PER_PAGE: 50,
  CONVERSATION_REFRESH_INTERVAL: 10000, // milliseconds
};

export default config;
