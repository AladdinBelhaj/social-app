export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface MediaFile {
  url: string;
  type: string;
}

export interface Reactions {
  like: number;
  love: number;
  haha: number;
  user_reaction?: 'like' | 'love' | 'haha' | null;
}

export interface Comment {
  id: string;
  text: string;
  time: string;
}

export interface Post {
  id: string;
  user_id: string | number;
  user: User | null;
  text: string;
  media: MediaFile | null;
  timestamp: string;
  reactions: Reactions;
  comments: Comment[];
}
