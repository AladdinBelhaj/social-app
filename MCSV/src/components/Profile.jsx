import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const { user, profile, updateProfile, loading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { error: updateError } = await updateProfile({
      full_name: fullName,
      bio,
      avatar_url: avatarUrl,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess('Profile updated successfully!');
      setEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!profile) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt={profile.username} />
            ) : (
              <div className="avatar-placeholder">
                {profile.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h2>@{profile.username}</h2>
            <p className="full-name">{profile.full_name || 'No name set'}</p>
          </div>
        </div>

        {!editing ? (
          <div className="profile-details">
            <div className="detail-section">
              <h3>Bio</h3>
              <p>{profile.bio || 'No bio yet...'}</p>
            </div>
            <div className="detail-section">
              <h3>Email</h3>
              <p>{user.email}</p>
            </div>
            <div className="detail-section">
              <h3>Member Since</h3>
              <p>{new Date(profile.created_at).toLocaleDateString()}</p>
            </div>
            <button onClick={() => setEditing(true)} className="btn-secondary">
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="profile-edit-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
                rows="4"
              />
            </div>
            <div className="form-group">
              <label>Avatar URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <div className="button-group">
              <button type="submit" className="btn-primary">
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Profile;
