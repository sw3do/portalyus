export interface Channel {
  id: string;
  name: string;
  slug: string;
  image?: string;
  created_at: string;
  video_count?: number;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  slug: string;
  video_file?: string;
  thumbnail?: string;
  duration?: number;
  view_count?: number;
  views?: number;
  created_at: string;
  channel_name: string;
  channel_id: string;
  channel_slug: string;
  channel_profile_image?: string;
  category_name: string;
  category_id: string;
  category_slug: string;
  is_featured: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at?: string;
  video_count?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}