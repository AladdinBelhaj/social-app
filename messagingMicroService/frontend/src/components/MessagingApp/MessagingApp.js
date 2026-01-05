/**
 * MessagingApp - Main Container Component
 * This is the primary component that can be imported into larger projects
 * It handles the overall layout and component orchestration
 */

import React from 'react';
import { MessagingProvider, useMessaging } from '../../context/MessagingContext';
import UserSelector from '../UserSelector/UserSelector';
import ConversationList from '../ConversationList/ConversationList';
import MessageThread from '../MessageThread/MessageThread';
import './MessagingApp.css';

/**
 * Inner component that uses the context
 */
const MessagingAppContent = () => {
  const { isAuthenticated, currentUser, wsStatus } = useMessaging();

  if (!isAuthenticated) {
    return <UserSelector />;
  }

  return (
    <div className="messaging-app">
      <header className="messaging-app-header">
        <h1>💬 Messaging</h1>
        <div className="user-info">
          <span className="username">{currentUser?.username}</span>
          <span className={`ws-status ${wsStatus}`}>
            {wsStatus === 'connected' ? '🟢' : '🔴'} {wsStatus}
          </span>
        </div>
      </header>
      
      <div className="messaging-app-body">
        <aside className="conversations-sidebar">
          <ConversationList />
        </aside>
        
        <main className="messages-main">
          <MessageThread />
        </main>
      </div>
    </div>
  );
};

/**
 * Main MessagingApp component with provider
 * Export this component to use in larger projects
 */
const MessagingApp = ({ config }) => {
  return (
    <MessagingProvider config={config}>
      <MessagingAppContent />
    </MessagingProvider>
  );
};

export default MessagingApp;
