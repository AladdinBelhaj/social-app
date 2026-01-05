import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { user: profileData } = await authApi.getProfile();
        setUser({ id: profileData.id, email: profileData.email });
        setProfile(profileData);
      } catch (error) {
        console.error('Error loading profile', error);
        authApi.clearSession();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const fetchProfile = async () => {
    const { user: profileData } = await authApi.getProfile();
    setUser({ id: profileData.id, email: profileData.email });
    setProfile(profileData);
  };

  const register = async (email, password, username, fullName) => {
    try {
      const { token, user: profileData } = await authApi.register({
        email,
        password,
        username,
        fullName,
      });

      authApi.saveToken(token);
      setUser({ id: profileData.id, email: profileData.email });
      setProfile(profileData);

      return { data: profileData, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const login = async (email, password) => {
    try {
      const { token, user: profileData } = await authApi.login({ email, password });
      authApi.saveToken(token);
      setUser({ id: profileData.id, email: profileData.email });
      setProfile(profileData);
      return { data: profileData, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const logout = () => {
    authApi.clearSession();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates) => {
    try {
      const { user: profileData } = await authApi.updateProfile(updates);
      setProfile(profileData);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    profile,
    loading,
    register,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
