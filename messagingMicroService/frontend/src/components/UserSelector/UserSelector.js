import React, { useState } from 'react';
import { useMessaging } from '../../context/MessagingContext';
import './UserSelector.css';

const UserSelector = () => {
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState('create');
  const { login, loading, error } = useMessaging();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (username.trim()) {
      await login(username.trim(), mode === 'existing');
    }
  };

  return (
    <div className="user-selector-container">
      <div className="user-selector-card">
        <h1 className="user-selector-title">💬 Welcome to Messaging</h1>
        <p className="user-selector-subtitle">Connect and chat in real-time</p>

        <div className="mode-selector">
          <button
            className={`mode-btn ${mode === 'create' ? 'active' : ''}`}
            onClick={() => setMode('create')}
          >
            Create New User
          </button>
          <button
            className={`mode-btn ${mode === 'existing' ? 'active' : ''}`}
            onClick={() => setMode('existing')}
          >
            Existing User
          </button>
        </div>

        <form onSubmit={handleSubmit} className="user-selector-form">
          <div className="form-group">
            <label htmlFor="username">
              {mode === 'create' ? 'Choose a username' : 'Enter your username'}
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoFocus
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Connecting...
              </>
            ) : (
              mode === 'create' ? 'Create & Login' : 'Login'
            )}
          </button>
        </form>

        <div className="user-selector-info">
          <p>🔒 Your messages are stored securely</p>
          <p>⚡ Real-time WebSocket connection</p>
        </div>
      </div>
    </div>
  );
};

export default UserSelector;
