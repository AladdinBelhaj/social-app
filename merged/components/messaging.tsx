import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth-context';
import { messagingApi, friendsApi } from '../lib/api-client';
import { Conversation, Message } from '../types/messaging';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Send, Search, Plus, MessageSquare, Users as UsersIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const Messaging: React.FC = () => {
    const { profile } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [friends, setFriends] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'chats' | 'friends'>('chats');
    const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchingUser, setIsSearchingUser] = useState(false);
    const [searchUserQuery, setSearchUserQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

    const scrollRef = useRef<HTMLDivElement>(null);
    const ws = useRef<WebSocket | null>(null);
    const connectingRef = useRef<boolean>(false);
    const activeConversationIdRef = useRef<number | null>(null);
    const isMounted = useRef<boolean>(true);

    // Keep the ref in sync with state for the WS handler
    useEffect(() => {
        activeConversationIdRef.current = activeConversationId;
    }, [activeConversationId]);

    // Stable WebSocket Connection - Initialize once per mount
    useEffect(() => {
        // Skip if profile not loaded
        if (!profile?.id || !isMounted.current) return;

        const token = localStorage.getItem('token');

        if (!token) {
            console.error('No token in localStorage');
            setConnectionStatus('disconnected');
            return;
        }

        // Skip if already connecting
        if (connectingRef.current || ws.current) {
            console.log('WebSocket already connecting or connected');
            return;
        }

        connectingRef.current = true;
        const wsURL = `ws://localhost:8762/api/messaging/ws/${profile.id}?token=${encodeURIComponent(token)}`;
        console.log('Connecting to WebSocket:', wsURL);

        const socket = new WebSocket(wsURL);

        socket.onopen = () => {
            console.log('✓ WebSocket connected');
            setConnectionStatus('connected');
            ws.current = socket;
            connectingRef.current = false;
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            setConnectionStatus('disconnected');
        };

        socket.onclose = () => {
            console.log('WebSocket closed');
            setConnectionStatus('disconnected');
            ws.current = null;
            connectingRef.current = false;
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WebSocket message received:', data);

                // Handle online users list
                if (data.type === 'online_users') {
                    console.log('Online users:', data.users);
                }
                // Handle incoming messages
                else if (data.type === 'message' && activeConversationIdRef.current) {
                    if (data.conversation_id === activeConversationIdRef.current) {
                        setMessages(prev => [...prev, data]);
                    }
                }
            } catch (err) {
                console.error('Failed to parse WebSocket message:', err);
            }
        };

        // Cleanup on unmount
        return () => {
            console.log('Cleaning up WebSocket on unmount');
            if (socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
            ws.current = null;
        };
    }, [profile?.id]); // Only reconnect if profile.id changes


    useEffect(() => {
        if (profile?.id) {
            loadConversations();
            loadFriends();
        }
    }, [profile?.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const loadConversations = async () => {
        try {
            const data = await messagingApi.getConversations();
            console.log('Loaded conversations:', data);
            setConversations(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load conversations', err);
            setConversations([]);
        } finally {
            setLoading(false);
        }
    };

    const loadFriends = async () => {
        try {
            const data = await friendsApi.listFriends();
            // Data shape: { friends: [{ friend: { id, username, ... } }] }
            if (data && Array.isArray(data.friends)) {
                const flatFriends = data.friends.map((f: any) => f.friend);
                setFriends(flatFriends);
            } else {
                setFriends([]);
            }
        } catch (err) {
            console.error('Failed to load friends', err);
            setFriends([]);
        }
    };

    const loadMessages = async (id: number) => {
        try {
            const data = await messagingApi.getMessages(id);
            setMessages(Array.isArray(data) ? data : []);
            setActiveConversationId(id);
        } catch (err) {
            console.error('Failed to load messages', err);
            setMessages([]);
        }
    };

    const handleFriendClick = (friend: any) => {
        if (!Array.isArray(conversations)) return;
        const existing = conversations.find(c =>
            c.participant_1_id === friend.id || c.participant_2_id === friend.id
        );
        if (existing) {
            loadMessages(existing.id);
            setActiveTab('chats');
        } else {
            handleStartNewChatWithUser(friend);
        }
    };

    const handleStartNewChatWithUser = (user: any) => {
        if (!Array.isArray(conversations)) return;
        const existing = conversations.find(c =>
            c.participant_1_id === user.id || c.participant_2_id === user.id
        );
        if (existing) {
            loadMessages(existing.id);
        } else {
            setMessages([]);
            setActiveConversationId(-user.id);
        }
        setIsSearchingUser(false);
        setActiveTab('chats');
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversationId || !profile) return;

        let receiverId: number | undefined;
        let receiverUsername: string | undefined;

        if (activeConversationId < 0) {
            receiverId = -activeConversationId;
            const friend = friends.find(f => f.id === receiverId);
            receiverUsername = friend?.username;
        } else {
            const activeConv = Array.isArray(conversations)
                ? conversations.find(c => c.id === activeConversationId)
                : null;
            if (activeConv) {
                const isP1 = activeConv.participant_1_id === profile.id;
                receiverId = isP1 ? activeConv.participant_2_id : activeConv.participant_1_id;
                receiverUsername = isP1 ? activeConv.participant_2?.username : activeConv.participant_1?.username;
            }
        }

        console.log('DEBUG: handleSendMessage', {
            currentUserId: profile.id,
            receiverId,
            receiverUsername,
            activeConversationId,
            friends,
            conversations,
        });

        if (!receiverId) return;

        try {
            const msg = await messagingApi.sendMessage(receiverId, newMessage.trim(), receiverUsername);
            if (activeConversationId < 0) {
                setActiveConversationId(msg.conversation_id);
                loadMessages(msg.conversation_id);
            } else {
                setMessages(prev => [...prev, msg]);
            }
            setNewMessage('');
            loadConversations();
        } catch (err) {
            console.error('Failed to send message', err);
        }
    };

    const handleStartNewChat = async () => {
        if (!searchUserQuery.trim()) return;
        try {
            const targetUser = await messagingApi.getUserByUsername(searchUserQuery.trim());
            if (targetUser) {
                handleStartNewChatWithUser(targetUser);
            }
        } catch (err) {
            alert('User not found');
        }
    };

    const activeConversation = activeConversationId && activeConversationId > 0 && Array.isArray(conversations)
        ? conversations.find(c => c.id === activeConversationId)
        : null;

    const draftUser = activeConversationId && activeConversationId < 0 && Array.isArray(friends)
        ? friends.find(f => f.id === -activeConversationId)
        : null;

    const otherUser = activeConversation
        ? (activeConversation.participant_1_id === profile?.id
            ? activeConversation.participant_2
            : activeConversation.participant_1)
        : (draftUser || null);

    if (loading && !profile) {
        return <div className="flex items-center justify-center h-full">Loading...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] py-6 px-4 flex gap-4 overflow-hidden">
            {/* Sidebar */}
            <Card className="w-80 flex flex-col overflow-hidden border-none shadow-lg">
                <div className="p-4 border-b bg-muted/30">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-lg tracking-tight">Messages</h2>
                        <Button variant="ghost" size="icon" onClick={() => setIsSearchingUser(true)}>
                            <Plus className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="flex bg-muted p-1 rounded-lg">
                        <button
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'chats' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => setActiveTab('chats')}
                        >
                            <MessageSquare className="h-3.5 w-3.5" /> Chats
                        </button>
                        <button
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'friends' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => setActiveTab('friends')}
                        >
                            <UsersIcon className="h-3.5 w-3.5" /> Friends
                        </button>
                    </div>
                </div>

                <div className="p-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={activeTab === 'chats' ? "Search conversations..." : "Search friends..."}
                            className="pl-9 h-9 bg-muted/50 border-none focus-visible:ring-1"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2">
                    {activeTab === 'chats' ? (
                        conversations.length > 0 ? (
                            conversations.filter(c => {
                                const other = c.participant_1_id === profile?.id ? c.participant_2 : c.participant_1;
                                return other.username.toLowerCase().includes(searchTerm.toLowerCase());
                            }).map((conv) => {
                                const other = conv.participant_1_id === profile?.id ? conv.participant_2 : conv.participant_1;
                                const isSelected = conv.id === activeConversationId;
                                return (
                                    <div
                                        key={conv.id}
                                        onClick={() => loadMessages(conv.id)}
                                        className={`p-3 my-1 flex items-center gap-3 cursor-pointer rounded-xl hover:bg-muted/50 transition-all ${isSelected ? 'bg-primary/10' : ''}`}
                                    >
                                        <Avatar className="h-12 w-12 border-2 border-background">
                                            <AvatarFallback className="bg-primary/5 text-primary">
                                                {other.username[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline">
                                                <p className={`font-semibold truncate ${isSelected ? 'text-primary' : ''}`}>
                                                    {other.username}
                                                </p>
                                                {conv.last_message && (
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {formatDistanceToNow(new Date(conv.last_message.timestamp), { addSuffix: false })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {conv.last_message?.content || 'No messages yet'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-10 text-center text-sm text-muted-foreground">
                                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p>No conversations yet.</p>
                            </div>
                        )
                    ) : (
                        friends.length > 0 ? (
                            friends.filter(f =>
                                f.username.toLowerCase().includes(searchTerm.toLowerCase())
                            ).map((friend) => (
                                <div
                                    key={friend.id}
                                    onClick={() => handleFriendClick(friend)}
                                    className={`p-3 my-1 flex items-center gap-3 cursor-pointer rounded-xl hover:bg-muted/50 transition-all ${activeConversationId === -friend.id ? 'bg-primary/10' : ''}`}
                                >
                                    <Avatar className="h-10 w-10 border-2 border-background">
                                        <AvatarFallback className="bg-muted text-muted-foreground">
                                            {friend.username[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate text-sm">{friend.username}</p>
                                        <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">Click to chat</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-10 text-center text-sm text-muted-foreground">
                                <UsersIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p>No friends found.</p>
                            </div>
                        )
                    )}
                </div>
                {connectionStatus !== 'connected' && (
                    <div className="px-4 py-2 bg-muted/50 text-[10px] font-medium text-muted-foreground flex items-center gap-2 border-t">
                        <div className={`h-1.5 w-1.5 rounded-full ${connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
                        {connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
                    </div>
                )}
            </Card>

            {/* Main Chat Area */}
            <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-lg">
                {activeConversation || draftUser ? (
                    <>
                        <div className="p-4 border-b flex items-center justify-between bg-background/50 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border-2 border-muted/20">
                                    <AvatarFallback className="bg-primary/5 text-primary">
                                        {otherUser?.username[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold leading-none mb-1">{otherUser?.username}</p>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`h-1.5 w-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                            {connectionStatus === 'connected' ? 'Online' : 'Connecting...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/40">
                            <div className="space-y-6">
                                {messages.map((msg) => {
                                    const isOwn = msg.sender_id === profile?.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all ${isOwn
                                                ? 'bg-blue-600 text-white rounded-tr-none'
                                                : 'bg-white border text-slate-700 rounded-tl-none'
                                                }`}>
                                                {msg.content}
                                                <div className={`text-[10px] mt-1.5 font-medium opacity-60 ${isOwn ? 'text-right' : 'text-left'}`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={scrollRef} />
                            </div>
                        </div>

                        <div className="p-4 border-t bg-background">
                            <form onSubmit={handleSendMessage} className="flex gap-2 items-center bg-muted/30 p-1 rounded-xl pr-2 border border-muted/40">
                                <Input
                                    placeholder="Type your message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    autoComplete="off"
                                    className="border-none bg-transparent focus-visible:ring-0 shadow-none text-sm h-11"
                                />
                                <Button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    size="icon"
                                    className="h-9 w-9 shrink-0 rounded-lg shadow-blue-500/20 shadow-lg"
                                >
                                    <Send className="h-4.5 w-4.5" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-slate-50/20 p-8 text-center">
                        <div className="w-20 h-20 bg-muted/50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                            <MessageSquare className="h-10 w-10 opacity-20" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-1">Your Direct Messages</h3>
                        <p className="text-sm max-w-xs mb-8">
                            Select a friend from the sidebar or search to start a conversation.
                        </p>
                        <Button
                            variant="default"
                            className="rounded-full px-8 shadow-lg shadow-primary/20"
                            onClick={() => setActiveTab('friends')}
                        >
                            <UsersIcon className="h-4 w-4 mr-2" />
                            Browse Friends
                        </Button>
                    </div>
                )}
            </Card>

            {/* New Chat Dialog */}
            {isSearchingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
                    <Card className="w-[400px] border-none shadow-2xl p-0 overflow-hidden rounded-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b bg-muted/20 flex justify-between items-center">
                            <h3 className="font-bold text-lg">New Message</h3>
                            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => setIsSearchingUser(false)}>✕</Button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleStartNewChat(); }} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase text-muted-foreground ml-1">Recipient Username</p>
                                <Input
                                    placeholder="Enter username..."
                                    value={searchUserQuery}
                                    onChange={(e) => setSearchUserQuery(e.target.value)}
                                    className="h-12 bg-muted/30 border-none focus-visible:ring-1 text-base rounded-xl"
                                    autoFocus
                                />
                            </div>
                            <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20">
                                Start Conversation
                            </Button>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};
