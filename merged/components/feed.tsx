import React, { useState, useEffect } from 'react';
import { CreatePost } from './create-post';
import { Post } from './post';
import { publicationsApi, authApi } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import { Post as PostType } from '../types/post';
import { mockPosts } from '../lib/mock-data';

export const Feed: React.FC = () => {
    const { profile, loading } = useAuth();
    const [posts, setPosts] = useState<PostType[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const loadPosts = async () => {
            try {
                const data = await publicationsApi.list();
                const mappedPosts: PostType[] = (data || []).map((p: any) => ({
                    id: p.id.toString(),
                    user: null,
                    user_id: p.user_id,
                    text: p.text,
                    media: p.media_urls && p.media_urls.length > 0 ? {
                        url: `http://localhost:8762/api/pub${p.media_urls[0]}`,
                        type: p.media_urls[0].endsWith('.mp4') ? 'video/mp4' : 'image/jpeg'
                    } : null,
                    timestamp: p.created_at || new Date().toISOString(),
                    reactions: p.reactions || { like: 0, love: 0, haha: 0 },
                    comments: [],
                    user_reaction: p.user_reaction || null // Add user_reaction from API response
                }));

                // Resolve user names
                const resolvedPosts = await Promise.all(mappedPosts.map(async (post) => {
                    // Check if it's the current user
                    if (profile && post.user_id === profile.id) {
                        return {
                            ...post,
                            user: {
                                id: profile.id.toString(),
                                name: profile.full_name || profile.username,
                                avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`
                            }
                        };
                    }

                    try {
                        const { user: userData } = await authApi.getUserById(post.user_id);
                        return {
                            ...post,
                            user: {
                                id: userData.id.toString(),
                                name: userData.full_name || userData.username,
                                avatar: userData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`
                            }
                        };
                    } catch {
                        return post; // Fallback to "User #[ID]" managed by Post component
                    }
                }));

                setPosts(resolvedPosts);
            } catch (err) {
                console.error('Failed to load posts, using mock data', err);
                setPosts(mockPosts);
            } finally {
                setFetching(false);
            }
        };
        loadPosts();
    }, [profile]);

    function handleCreatePost(newPost: PostType) {
        setPosts((prev) => [newPost, ...prev]);
    }

    if (loading || fetching) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-muted-foreground animate-pulse">Loading feed...</p>
            </div>
        );
    }

    // Map profile to User type expected by CreatePost
    const currentUser = profile ? {
        id: profile.id.toString(),
        name: profile.full_name || profile.username,
        avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`,
    } : null;

    return (
        <div className="max-w-2xl mx-auto py-6 px-4">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Social Feed</h1>
                <p className="text-muted-foreground">Share your thoughts with the world</p>
            </div>

            {currentUser && <CreatePost user={currentUser} onCreate={handleCreatePost} />}

            <div className="space-y-4">
                {posts.map((post) => (
                    <Post key={post.id} post={post} />
                ))}
                {posts.length === 0 && !fetching && (
                    <p className="text-center py-10 text-muted-foreground">No posts yet. Be the first to publish!</p>
                )}
            </div>
        </div>
    );
};
