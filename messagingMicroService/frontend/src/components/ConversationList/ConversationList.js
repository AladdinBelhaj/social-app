import React, { useEffect, useState } from 'react';
import { useMessaging } from '../../context/MessagingContext';
import './ConversationList.css';

const ConversationList = () => {
  const {
    currentUser,
    conversations,
    activeConversation,
    loadConversations,
    loadMessages,
    loading,
    onlineUsers,
    startNewChat,
  } = useMessaging();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatUsername, setNewChatUsername] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadConversations(currentUser.id);
    }
  }, [currentUser, loadConversations]);

  const handleConversationClick = (conversationId) => {
    loadMessages(conversationId);
  };

  const handleStartChat = async () => {
    if (!newChatUsername.trim() || !currentUser) return;
    
    const username = newChatUsername.trim();
    
    if (username === currentUser.username) {
      alert('You cannot message yourself!');
      return;
    }
    
    setIsSearching(true);
    const result = await startNewChat(username);
    setIsSearching(false);
    
    if (result.success) {
      setShowNewChat(false);
      setNewChatUsername('');
      
      if (result.existingConversation) {
        loadMessages(result.conversationId);
      }
    } else {
      alert(result.message || 'User not found');
    }
  };

  const getOtherUser = (conversation) => {
    return conversation.participant_1_id === currentUser?.id
      ? conversation.participant_2
      : conversation.participant_1;
  };
  
  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 24 hours
    if (diff < 86400000) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Less than 7 days
    if (diff < 604800000) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const otherUser = getOtherUser(conv);
    return otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conv.last_message?.content?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="conversation-list">
      <div className="conversation-list-header">
        <div className="header-content">
          <h2>Messages</h2>
          <span className="conversation-count">{conversations.length}</span>
        </div>
      </div>

      <div className="search-and-new">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <button
          className="start-chat-btn"
          onClick={() => setShowNewChat(!showNewChat)}
          title="Start New Chat"
        >
          {showNewChat ? '✕' : '💬 Start Chat'}
        </button>
      </div>

      {showNewChat && (
        <div className="new-chat-panel">
          <h4>Start New Conversation</h4>
          <div className="new-chat-input-group">
            <input
              type="text"
              placeholder="Enter username..."
              value={newChatUsername}
              onChange={(e) => setNewChatUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleStartChat()}
              autoFocus
              disabled={isSearching}
            />
            <button 
              onClick={handleStartChat}
              disabled={!newChatUsername.trim() || isSearching}
              className="btn-start"
            >
              {isSearching ? '⏳' : '→'}
            </button>
          </div>
        </div>
      )}

      <div className="conversation-items">
        {loading && conversations.length === 0 ? (
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="empty-state">
            <p>📭 No conversations yet</p>
            <p className="empty-hint">Start a new chat to begin messaging</p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const otherUser = getOtherUser(conv);
            const isActive = conv.id === activeConversation;
            const lastMessage = conv.last_message;
            const isOnline = isUserOnline(otherUser?.id);

            return (
              <div
                key={conv.id}
                className={`conversation-item ${isActive ? 'active' : ''}`}
                onClick={() => handleConversationClick(conv.id)}
              >
                <div className="conversation-avatar-wrapper">
                  <div className="conversation-avatar">
                    {otherUser?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></span>
                </div>
                
                <div className="conversation-content">
                  <div className="conversation-header">
                    <span className="conversation-name">{otherUser?.username || 'Unknown'}</span>
                    {lastMessage && (
                      <span className="conversation-time">
                        {formatTimestamp(lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  
                  {lastMessage && (
                    <div className="conversation-preview">
                      {lastMessage.sender_id === currentUser?.id && (
                        <span className="you-indicator">You: </span>
                      )}
                      {lastMessage.content}
                      {lastMessage.sender_id === currentUser?.id && (
                        <span className="message-status">
                          {lastMessage.status === 'sent' && <span className="sent">✓</span>}
                          {lastMessage.status === 'delivered' && <span className="delivered">✓✓</span>}
                          {lastMessage.status === 'read' && <span className="read">✓✓</span>}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;
