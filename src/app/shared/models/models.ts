
export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  company: string;
  avatar: string;
}

export interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
  createdAt: number;
}

export interface Comment {
  id: number;
  postId: number;
  author: string;
  body: string;
}

export type SortOrder = 'recent' | 'title';
