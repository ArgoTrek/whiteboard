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
    // Used in frontend
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
    avatar_url?: string;
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