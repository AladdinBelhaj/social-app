import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from './api-client';

interface User {
    id: number;
    email: string;
    username: string;
    full_name?: string;
    bio?: string;
    avatar_url?: string;
}

interface AuthContextType {
    user: { id: number; email: string } | null;
    profile: User | null;
    loading: boolean;
    register: (email: string, password: string, username: string, fullName: string) => Promise<{ data: User | null; error: any }>;
    login: (email: string, password: string) => Promise<{ data: User | null; error: any }>;
    logout: () => void;
    updateProfile: (updates: Partial<User>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<{ id: number; email: string } | null>(null);
    const [profile, setProfile] = useState<User | null>(null);
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

    const register = async (email: string, password: string, username: string, fullName: string) => {
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

    const login = async (email: string, password: string) => {
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

    const updateProfile = async (updates: Partial<User>) => {
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
