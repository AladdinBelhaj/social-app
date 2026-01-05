import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { friendsApi } from '../lib/api-client';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Search, UserPlus, UserCheck, UserMinus, Clock } from 'lucide-react';

export const Friends: React.FC = () => {
    const { user, loading } = useAuth();
    const [friends, setFriends] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [sentRequests, setSentRequests] = useState<any[]>([]);
    const [searchUsername, setSearchUsername] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        } else if (user) {
            loadAll();
        }
    }, [user, loading, navigate]);

    const loadAll = () => {
        loadFriends();
        loadPendingRequests();
        loadSentRequests();
    };

    const loadFriends = async () => {
        try {
            const { friends: data } = await friendsApi.listFriends();
            setFriends(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadPendingRequests = async () => {
        try {
            const { pending } = await friendsApi.listPending();
            setPendingRequests(pending || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadSentRequests = async () => {
        try {
            const { sent } = await friendsApi.listSent();
            setSentRequests(sent || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!searchUsername.trim()) return;

        try {
            const { results } = await friendsApi.search(searchUsername);
            setSearchResults(results || []);
        } catch (err) {
            setError('Search failed');
        }
    };

    const sendRequest = async (id: number) => {
        try {
            await friendsApi.sendRequest(id);
            setSuccess('Request sent!');
            setSearchResults([]);
            setSearchUsername('');
            loadSentRequests();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to send request');
        }
    };

    const acceptRequest = async (requestId: number) => {
        try {
            await friendsApi.acceptRequest(requestId);
            setSuccess('Accepted!');
            loadAll();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to accept');
        }
    };

    const rejectRequest = async (requestId: number) => {
        try {
            await friendsApi.rejectRequest(requestId);
            loadPendingRequests();
        } catch (err) {
            setError('Failed to reject');
        }
    };

    const removeFriend = async (id: number) => {
        try {
            await friendsApi.removeFriend(id);
            setSuccess('Friend removed');
            loadFriends();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to remove');
        }
    };

    if (loading) return null;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold">Social Network</h1>
                    <p className="text-muted-foreground">Manage your connections and find new friends</p>
                </div>
            </div>

            {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">{error}</div>}
            {success && <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">{success}</div>}

            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    {/* Search Section */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Search className="h-5 w-5" /> Find People
                        </h2>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                placeholder="Search by username..."
                                value={searchUsername}
                                onChange={(e) => setSearchUsername(e.target.value)}
                            />
                            <Button type="submit">Search</Button>
                        </form>

                        {searchResults.length > 0 && (
                            <div className="grid gap-3">
                                {searchResults.map((res) => (
                                    <Card key={res.id} className="p-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={res.avatar_url} />
                                                <AvatarFallback>{res.username[0].toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-medium">@{res.username}</p>
                                                <p className="text-xs text-muted-foreground">{res.full_name}</p>
                                            </div>
                                            <Button size="sm" onClick={() => sendRequest(res.id)}>
                                                <UserPlus className="h-4 w-4 mr-2" /> Add
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Friends List */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <UserCheck className="h-5 w-5" /> My Friends ({friends.length})
                        </h2>
                        {friends.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-8 text-center border rounded-lg border-dashed">
                                No friends yet. Start by searching!
                            </p>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {friends.map((f) => (
                                    <Card key={f.id} className="p-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={f.friend.avatar_url} />
                                                <AvatarFallback>{f.friend.username[0].toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">@{f.friend.username}</p>
                                                <p className="text-xs text-muted-foreground truncate">{f.friend.full_name}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => removeFriend(f.friend_id)}
                                            >
                                                <UserMinus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <div className="space-y-8">
                    {/* Pending Requests */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Clock className="h-5 w-5" /> Pending ({pendingRequests.length})
                        </h2>
                        {pendingRequests.map((r) => (
                            <Card key={r.id} className="p-3">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={r.user.avatar_url} />
                                            <AvatarFallback>{r.user.username[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">@{r.user.username}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" className="flex-1 h-8" onClick={() => acceptRequest(r.id)}>Accept</Button>
                                        <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => rejectRequest(r.id)}>Ignore</Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        {pendingRequests.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-4 italic">No pending requests</p>
                        )}
                    </section>

                    <Separator />

                    {/* Sent Requests */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold">Sent Requests</h2>
                        {sentRequests.map((r) => (
                            <div key={r.id} className="flex items-center gap-3 text-sm">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={r.friend.avatar_url} />
                                    <AvatarFallback>{r.friend.username[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="flex-1 truncate">@{r.friend.username}</span>
                                <Badge variant="secondary" className="font-normal text-[10px]">Waiting</Badge>
                            </div>
                        ))}
                        {sentRequests.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-2 italic">Nothing sent recently</p>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};
