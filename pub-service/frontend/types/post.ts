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
}

export interface Comment {
  id: string;
  text: string;
  time: string;
}

export interface Post {
  id: string;
  user: User;
  text: string;
  media: MediaFile | null;
  timestamp: string;
  reactions: Reactions;
  comments: Comment[];
}
