import React, { useState } from 'react';
import { CreatePost } from '@/components/create-post';
import { Post } from '@/components/post';
import { currentUser, mockPosts } from '@/lib/mock-data';
import { Post as PostType } from '@/types/post';

function App() {
  const [posts, setPosts] = useState<PostType[]>(mockPosts);

  function handleCreatePost(newPost: PostType) {
    setPosts((prev) => [newPost, ...prev]);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Social Feed</h1>
          <p className="text-muted-foreground">Share your thoughts with the world</p>
        </div>

        <CreatePost user={currentUser} onCreate={handleCreatePost} />

        <div>
          {posts.map((post) => (
            <Post key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
