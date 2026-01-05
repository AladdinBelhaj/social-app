import { User, Post } from '@/types/post';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  },
  {
    id: '2',
    name: 'Michael Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
  },
  {
    id: '3',
    name: 'Emma Davis',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
  },
  {
    id: '4',
    name: 'James Wilson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
  },
  {
    id: '5',
    name: 'Olivia Martinez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia',
  },
];

export const currentUser: User = mockUsers[0];

export const mockPosts: Post[] = [
  {
    id: '1',
    user: mockUsers[1],
    text: 'Just finished an amazing hiking trail! The view from the top was absolutely breathtaking. 🏔️',
    media: null,
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    reactions: { like: 15, love: 8, haha: 0 },
    comments: [
      {
        id: 'c1',
        text: 'Looks amazing! Which trail was this?',
        time: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: '2',
    user: mockUsers[2],
    text: 'Made some homemade pasta today! First time trying and it turned out better than expected 🍝',
    media: null,
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    reactions: { like: 42, love: 23, haha: 2 },
    comments: [],
  },
  {
    id: '3',
    user: mockUsers[3],
    text: 'Beautiful sunset at the beach this evening 🌅',
    media: null,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    reactions: { like: 89, love: 56, haha: 1 },
    comments: [
      {
        id: 'c2',
        text: 'Gorgeous colors!',
        time: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'c3',
        text: 'I miss the beach so much!',
        time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: '4',
    user: mockUsers[4],
    text: 'Started reading a new book today. Anyone else reading something good lately? 📚',
    media: null,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    reactions: { like: 12, love: 4, haha: 0 },
    comments: [],
  },
  {
    id: '5',
    user: mockUsers[1],
    text: 'Coffee and a good book on a rainy Sunday morning ☕',
    media: null,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    reactions: { like: 67, love: 34, haha: 0 },
    comments: [
      {
        id: 'c4',
        text: 'Perfect way to spend a Sunday!',
        time: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
];
