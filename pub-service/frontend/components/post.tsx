import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ThumbsUp, Heart, Smile, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Post as PostType, Comment } from '@/types/post';
import { timeAgo } from '@/lib/time-utils';

interface PostProps {
  post: PostType;
}

export function Post({ post }: PostProps) {
  const [reactions, setReactions] = useState(post.reactions);
  const [comments, setComments] = useState<Comment[]>(post.comments);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  function react(type: keyof typeof reactions) {
    setReactions((prev) => ({ ...prev, [type]: prev[type] + 1 }));
  }

  function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    const newComment: Comment = {
      id: Date.now().toString(),
      text: commentText.trim(),
      time: new Date().toISOString(),
    };
    
    setComments((prev) => [...prev, newComment]);
    setCommentText('');
    setShowComments(true);
  }

  const initials = post.user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const totalReactions = reactions.like + reactions.love + reactions.haha;

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.user.avatar} alt={post.user.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-semibold text-sm">{post.user.name}</div>
            <div className="text-xs text-muted-foreground">{timeAgo(post.timestamp)}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {post.text && <p className="text-sm leading-relaxed">{post.text}</p>}

        {post.media && (
          <div className="rounded-lg overflow-hidden border">
            {post.media.type.startsWith('video') ? (
              <video src={post.media.url} controls className="w-full max-h-96 object-contain bg-black" />
            ) : (
              <img src={post.media.url} alt="post media" className="w-full max-h-96 object-contain bg-gray-50" />
            )}
          </div>
        )}

        {totalReactions > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {reactions.like > 0 && <span>👍 {reactions.like}</span>}
            {reactions.love > 0 && <span>❤️ {reactions.love}</span>}
            {reactions.haha > 0 && <span>😂 {reactions.haha}</span>}
          </div>
        )}

        <Separator />

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => react('like')}
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            Like
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => react('love')}
          >
            <Heart className="h-4 w-4 mr-1" />
            Love
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => react('haha')}
          >
            <Smile className="h-4 w-4 mr-1" />
            Haha
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => setShowComments((s) => !s)}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            {showComments ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            {comments.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{comments.length}</Badge>}
          </Button>
        </div>

        {showComments && (
          <div className="space-y-3 pt-2">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
            ) : (
              <div className="space-y-2">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-muted rounded-lg p-3">
                    <p className="text-sm">{comment.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo(comment.time)}</p>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={addComment} className="flex gap-2">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1"
              />
              <Button type="submit" size="sm">
                Send
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
