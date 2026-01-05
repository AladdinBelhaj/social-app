import React, { useEffect, useRef } from 'react';
import { useMessaging } from '../../context/MessagingContext';
import MessageInput from '../MessageInput/MessageInput';
import './MessageThread.css';

const MessageThread = () => {
  const {
    currentUser,
    conversations,
    activeConversation,
    messages,
    loading,
    sendMessage,
    loadConversations,
    newChatTarget,
    onlineUsers,
  } = useMessaging();

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const isNewChatMode = newChatTarget && !activeConversation;
  
  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  if (!activeConversation && !isNewChatMode) {
    return (
      <div className="message-thread-empty">
        <div className="empty-content">
          <div className="empty-icon">💬</div>
          <h3>Select a conversation</h3>
          <p>Choose a chat from the list or use "Start Chat" button</p>
        </div>
      </div>
    );
  }

  if (isNewChatMode) {
    const targetUser = newChatTarget;
    const isOnline = isUserOnline(targetUser.id);
    
    return (
      <div className="message-thread">
        <div className="message-thread-header">
          <div className="conversation-info">
            <div className="header-avatar-wrapper">
              <div className="header-avatar">
                {targetUser.username.charAt(0).toUpperCase()}
              </div>
              <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></span>
            </div>
            <div className="header-details">
              <h3>{targetUser.username}</h3>
              <span className={`status-text ${isOnline ? 'online' : 'offline'}`}>
                {isOnline ? 'Active now' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        <div className="message-thread-body">
          <div className="no-messages">
            <p>👋 Starting a new conversation</p>
            <p className="no-messages-hint">Send your first message to {targetUser.username}</p>
          </div>
          <div ref={messagesEndRef} />
        </div>

        <MessageInput receiverId={targetUser.id} />
      </div>
    );
  }

  const conversation = conversations.find(c => c.id === activeConversation);
  const otherUser = conversation
    ? (conversation.participant_1_id === currentUser?.id
        ? conversation.participant_2
        : conversation.participant_1)
    : null;
  
  const isOnline = isUserOnline(otherUser?.id);

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateSeparator = (timestamp) => {
    const date = new Date(timestamp);
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
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="message-thread">
      <div className="message-thread-header">
        <div className="conversation-info">
          <div className="header-avatar-wrapper">
            <div className="header-avatar">
              {otherUser?.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></span>
          </div>
          <div className="header-details">
            <h3>{otherUser?.username || 'Unknown'}</h3>
            <span className={`status-text ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? 'Active now' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      <div className="message-thread-body">
        {loading && messages.length === 0 ? (
          <div className="loading-messages">
            <div className="spinner-large"></div>
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="no-messages">
            <p>📭 No messages yet</p>
            <p className="no-messages-hint">Start the conversation!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date} className="message-group">
              <div className="date-separator">
                <span>{formatDateSeparator(msgs[0].timestamp)}</span>
              </div>
              
              {msgs.map((message, index) => {
                const isOwn = message.sender_id === currentUser?.id;
                const showAvatar = index === 0 || msgs[index - 1].sender_id !== message.sender_id;

                return (
                  <div
                    key={message.id}
                    className={`message ${isOwn ? 'own' : 'other'}`}
                  >
                    {!isOwn && showAvatar && (
                      <div className="message-avatar">
                        {otherUser?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    {!isOwn && !showAvatar && <div className="message-avatar-spacer"></div>}
                    
                    <div className="message-bubble">
                      <div className="message-content">{message.content}</div>
                      <div className="message-meta">
                        <span className="message-time">
                          {formatMessageTime(message.timestamp)}
                        </span>
                        {isOwn && (
                          <span className="message-status">
                            {message.status === 'sent' && <span className="sent">✓</span>}
                            {message.status === 'delivered' && <span className="delivered">✓✓</span>}
                            {message.status === 'read' && <span className="read">✓✓</span>}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput receiverId={otherUser?.id} />
    </div>
  );
};

export default MessageThread;
