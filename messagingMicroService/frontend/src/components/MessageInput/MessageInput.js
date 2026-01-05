/**
 * MessageInput Component
 * Input field for composing and sending messages
 * Reusable in different contexts
 */

import React, { useState, useRef, useEffect } from 'react';
import { useMessaging } from '../../context/MessagingContext';
import './MessageInput.css';

const MessageInput = ({ receiverId }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { sendMessage } = useMessaging();
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus input when component mounts or receiverId changes
    inputRef.current?.focus();
  }, [receiverId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || isSending || !receiverId) return;

    setIsSending(true);
    try {
      await sendMessage(receiverId, message.trim());
      setMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="message-input-container">
      <form onSubmit={handleSubmit} className="message-input-form">
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            disabled={isSending}
            className="message-textarea"
          />
        </div>
        
        <button
          type="submit"
          disabled={!message.trim() || isSending}
          className="send-button"
          title="Send message"
        >
          {isSending ? (
            <span className="spinner-small"></span>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              width="24"
              height="24"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </form>
      
      <div className="input-hint">
        Press <kbd>Enter</kbd> to send, <kbd>Shift + Enter</kbd> for new line
      </div>
    </div>
  );
};

export default MessageInput;
