import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { friendsApi } from '../api/client';
import { useNavigate } from 'react-router-dom';

function Friends() {
  const { user, loading } = useAuth();
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (user) {
      loadFriends();
      loadPendingRequests();
      loadSentRequests();
    }
  }, [user, loading, navigate]);

  const loadFriends = async () => {
    try {
      const { friends: friendData } = await friendsApi.listFriends();
      setFriends(friendData || []);
    } catch (err) {
      console.error('Error loading friends:', err);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const { pending } = await friendsApi.listPending();
      setPendingRequests(pending || []);
    } catch (err) {
      console.error('Error loading pending requests:', err);
    }
  };

  const loadSentRequests = async () => {
    try {
      const { sent } = await friendsApi.listSent();
      setSentRequests(sent || []);
    } catch (err) {
      console.error('Error loading sent requests:', err);
    }
  };

  const searchUsers = async (e) => {
    e.preventDefault();
    setError('');
    setSearchResults([]);

    if (!searchUsername.trim()) {
      setError('Please enter a username to search');
      return;
    }

    try {
      const { results } = await friendsApi.search(searchUsername);
      setSearchResults(results || []);
    } catch (err) {
      setError('Error searching users');
      console.error(err);
    }
  };

  const sendFriendRequest = async (friendId) => {
    setError('');
    setSuccess('');

    try {
      await friendsApi.sendRequest(friendId);
      setSuccess('Friend request sent!');
      setSearchResults([]);
      setSearchUsername('');
      loadSentRequests();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error sending friend request');
    }
  };

  const acceptFriendRequest = async (requestId, friendId) => {
    try {
      await friendsApi.acceptRequest(requestId);

      setSuccess('Friend request accepted!');
      loadFriends();
      loadPendingRequests();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error accepting friend request');
      console.error(err);
    }
  };

  const rejectFriendRequest = async (requestId) => {
    try {
      await friendsApi.rejectRequest(requestId);
      loadPendingRequests();
    } catch (err) {
      setError('Error rejecting friend request');
      console.error(err);
    }
  };

  const removeFriend = async (friendId) => {
    try {
      await friendsApi.removeFriend(friendId);
      setSuccess('Friend removed');
      loadFriends();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error removing friend');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="friends-container">
      <h1>Friends</h1>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="search-section">
        <h2>Find Friends</h2>
        <form onSubmit={searchUsers} className="search-form">
          <input
            type="text"
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            placeholder="Search by username"
          />
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="search-results">
            <h3>Search Results</h3>
            {searchResults.map((result) => (
              <div key={result.id} className="user-card">
                <div className="user-info">
                  <div className="avatar-small">
                    {result.avatar_url ? (
                      <img src={result.avatar_url} alt={result.username} />
                    ) : (
                      <div className="avatar-placeholder-small">
                        {result.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="username">@{result.username}</p>
                    <p className="full-name">{result.full_name || 'No name'}</p>
                  </div>
                </div>
                <button
                  onClick={() => sendFriendRequest(result.id)}
                  className="btn-secondary"
                >
                  Add Friend
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingRequests.length > 0 && (
        <div className="requests-section">
          <h2>Pending Requests ({pendingRequests.length})</h2>
          {pendingRequests.map((request) => (
            <div key={request.id} className="user-card">
              <div className="user-info">
                <div className="avatar-small">
                  {request.user.avatar_url ? (
                    <img src={request.user.avatar_url} alt={request.user.username} />
                  ) : (
                    <div className="avatar-placeholder-small">
                      {request.user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="username">@{request.user.username}</p>
                  <p className="full-name">{request.user.full_name || 'No name'}</p>
                </div>
              </div>
              <div className="button-group">
                <button
                  onClick={() => acceptFriendRequest(request.id, request.user_id)}
                  className="btn-primary"
                >
                  Accept
                </button>
                <button
                  onClick={() => rejectFriendRequest(request.id)}
                  className="btn-danger"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sentRequests.length > 0 && (
        <div className="sent-requests-section">
          <h2>Sent Requests ({sentRequests.length})</h2>
          {sentRequests.map((request) => (
            <div key={request.id} className="user-card">
              <div className="user-info">
                <div className="avatar-small">
                  {request.friend.avatar_url ? (
                    <img src={request.friend.avatar_url} alt={request.friend.username} />
                  ) : (
                    <div className="avatar-placeholder-small">
                      {request.friend.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="username">@{request.friend.username}</p>
                  <p className="full-name">{request.friend.full_name || 'No name'}</p>
                </div>
              </div>
              <span className="status-badge">Pending</span>
            </div>
          ))}
        </div>
      )}

      <div className="friends-list-section">
        <h2>My Friends ({friends.length})</h2>
        {friends.length === 0 ? (
          <p className="empty-state">No friends yet. Start by searching for users above!</p>
        ) : (
          friends.map((friendship) => (
            <div key={friendship.id} className="user-card">
              <div className="user-info">
                <div className="avatar-small">
                  {friendship.friend.avatar_url ? (
                    <img
                      src={friendship.friend.avatar_url}
                      alt={friendship.friend.username}
                    />
                  ) : (
                    <div className="avatar-placeholder-small">
                      {friendship.friend.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="username">@{friendship.friend.username}</p>
                  <p className="full-name">
                    {friendship.friend.full_name || 'No name'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFriend(friendship.friend_id)}
                className="btn-danger"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Friends;
