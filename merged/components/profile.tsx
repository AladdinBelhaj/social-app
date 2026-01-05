import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

export const Profile: React.FC = () => {
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

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const { error: updateError } = await updateProfile({
            full_name: fullName,
            bio,
            avatar_url: avatarUrl,
        });

        if (updateError) {
            setError(updateError.message || 'Failed to update profile');
        } else {
            setSuccess('Profile updated successfully!');
            setEditing(false);
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    if (loading || !profile) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-muted-foreground">Loading profile...</p>
            </div>
        );
    }

    const initials = profile.username?.charAt(0).toUpperCase();

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={avatarUrl} alt={profile.username} />
                        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <CardTitle className="text-2xl">@{profile.username}</CardTitle>
                        <p className="text-muted-foreground">{profile.full_name || 'No name set'}</p>
                    </div>
                    {!editing && (
                        <Button variant="outline" onClick={() => setEditing(true)}>
                            Edit Profile
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    {!editing ? (
                        <>
                            <div className="space-y-1">
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Bio</h3>
                                <p className="text-sm leading-relaxed">{profile.bio || 'No bio yet...'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Email</h3>
                                    <p className="text-sm">{user?.email}</p>
                                </div>
                                {/* @ts-ignore */}
                                {profile.created_at && (
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Member Since</h3>
                                        {/* @ts-ignore */}
                                        <p className="text-sm">{new Date(profile.created_at).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <Input
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Your full name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bio</label>
                                <Textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell us about yourself"
                                    rows={4}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Avatar URL</label>
                                <Input
                                    type="url"
                                    value={avatarUrl}
                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                    placeholder="https://example.com/avatar.jpg"
                                />
                            </div>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                            <div className="flex gap-2">
                                <Button type="submit">Save Changes</Button>
                                <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    )}
                    {success && (
                        <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
                            {success}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
