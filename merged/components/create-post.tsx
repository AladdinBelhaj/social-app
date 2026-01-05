import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ImageIcon, X } from 'lucide-react';
import { User, Post } from '@/types/post';
import { publicationsApi } from '../lib/api-client';

interface CreatePostProps {
  user: User;
  onCreate: (post: Post) => void;
}

export function CreatePost({ user, onCreate }: CreatePostProps) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError('');
  }

  function handleRemove() {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file && text.trim().length === 0) {
      setError('Please add text or attach a media file.');
      return;
    }
    // Upload to backend via Gateway
    setUploadProgress(10);
    const form = new FormData();
    form.append('text', text.trim());
    if (file) form.append('mediaFiles', file);

    publicationsApi.create(form)
      .then((data: any) => {
        setUploadProgress(100);
        const BACKEND_BASE = 'http://localhost:8762/api/pub';
        const mediaUrl = data.mediaUrls && data.mediaUrls.length ? data.mediaUrls[0] : null;
        const mediaFull = mediaUrl ? `${BACKEND_BASE}${mediaUrl}` : null;

        const post: Post = {
          id: Date.now().toString(),
          user,
          text: data.text || text.trim(),
          media: mediaFull ? { url: mediaFull, type: file ? file.type : 'image/*' } : null,
          timestamp: new Date().toISOString(),
          reactions: { like: 0, love: 0, haha: 0 },
          comments: [],
        };
        onCreate(post);
        setUploadProgress(null);
        setText('');
        setFile(null);
        setPreview(null);
        setError('');
      })
      .catch((err: any) => {
        setUploadProgress(null);
        setError('Upload failed.');
        console.error(err);
      });
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <Textarea
              placeholder={`What's on your mind, ${user.name.split(' ')[0]}?`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[60px] resize-none"
            />
          </div>

          {preview && (
            <div className="relative mb-4 rounded-lg overflow-hidden border">
              {file && file.type.startsWith('video') ? (
                <video src={preview} controls className="w-full max-h-96 object-contain bg-black" />
              ) : (
                <img src={preview} alt="preview" className="w-full max-h-96 object-contain bg-gray-50" />
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFile}
                className="hidden"
              />
              <Button type="button" variant="outline" size="sm" asChild>
                <span>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Add Photo/Video
                </span>
              </Button>
            </label>

            <Button type="submit" size="sm">
              Publish
            </Button>
          </div>

          {uploadProgress !== null && (
            <div className="mt-2 text-sm">Uploading... {uploadProgress}%</div>
          )}

          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
