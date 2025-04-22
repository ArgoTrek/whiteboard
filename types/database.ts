// types/database.ts

export type Board = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  cosmetic_id: number;
  board_id: string;
  user_id: string;
  content: string;
  push_count: number;
  created_at: string;
  updated_at: string;
  image_url?: string;
  author?: Profile;
  comment_count?: number;
  thumb_count?: number;
  user_has_thumbed?: boolean;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  // Used in frontend
  author?: Profile;
  thumb_count?: number;
  user_has_thumbed?: boolean;
};

export type Thumb = {
  id: string;
  user_id: string;
  post_id?: string;
  comment_id?: string;
  created_at: string;
};

export type UserPostDate = {
  id: string;
  user_id: string;
  last_post_date: string;
};

export type PostUniqueCommenter = {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
};

// Engagement & Flair Types
export type Flair = {
  id: string;
  name: string;
  type: string;
  rarity: string;
  css_class: string;
  preview_image_url?: string;
};

export type PostFlair = {
  id: string;
  applied_at: string;
  flair: Flair[];
};

export type InventoryItem = {
  id: string;
  acquired_at: string;
  flair: Flair;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  category: string;
  required_progress: number;
  current_progress: number;
  completed: boolean;
  completed_at: string | null;
  reward_claimed: boolean;
  progress_percentage: number;
  ink_reward: number;
  prismatic_reward: number;
  flair_reward: string | null;
  icon: string | null;
};

export type ActivityStatus = {
  check_in: boolean;
  posted: boolean;
  commented: boolean;
  liked: boolean;
  all_completed: boolean;
};

export type Currency = {
  ink_points: number;
  prismatic_ink: number;
};

// For Supabase database response
export type Tables = {
  boards: Board;
  posts: Post;
  comments: Comment;
  thumbs: Thumb;
  user_post_dates: UserPostDate;
  post_unique_commenters: PostUniqueCommenter;
};

// Types for API responses
export type PostsResponse = {
  posts: (Post & {
    profiles: Profile;
    comment_count: number;
    thumb_count: number;
    user_has_thumbed?: boolean;
  })[];
};

export type CommentsResponse = {
  comments: (Comment & {
    profiles: Profile;
    thumb_count: number;
    user_has_thumbed?: boolean;
  })[];
};

export type BoardsResponse = {
  boards: Board[];
};

export type ThumbResponse = {
  action: 'added' | 'removed';
};