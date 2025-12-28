import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Make sure to set these in your .env file:
// VITE_SUPABASE_URL=your_supabase_url
// VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create a Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Database types for better TypeScript support
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          avatar_url: string | null;
          description: string | null;
          banner_url: string | null;
          role: 'user' | 'creator' | 'admin';
          email_verified: boolean;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name: string;
          avatar_url?: string | null;
          description?: string | null;
          banner_url?: string | null;
          role?: 'user' | 'creator' | 'admin';
          email_verified?: boolean;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          avatar_url?: string | null;
          description?: string | null;
          banner_url?: string | null;
          role?: 'user' | 'creator' | 'admin';
          email_verified?: boolean;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      creator_profiles: {
        Row: {
          id: string;
          user_id: string;
          bio: string | null;
          category: string | null;
          website_url: string | null;
          twitter_handle: string | null;
          instagram_handle: string | null;
          youtube_channel: string | null;
          total_earnings: number;
          supporters_count: number;
          followers_count: number;
          posts_count: number;
          likes_count: number;
          created_at: string;
          updated_at: string;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          slug: string;
          number: number;
          is_published: boolean;
          is_premium: boolean;
          thumbnail_url: string | null;
          audio_file_url: string | null;
          video_file_url: string | null;
          views_count: number;
          likes_count: number;
          comments_count: number;
          created_at: string;
          updated_at: string;
          published_at: string | null;
          deleted_at: string | null;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
      };
      post_likes: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
      };
      post_comments: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          content: string;
          parent_comment_id: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      supporter_transactions: {
        Row: {
          id: string;
          supporter_id: string;
          creator_id: string;
          amount: number;
          message: string | null;
          status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
          gateway: 'stripe' | 'paypal' | 'esewa' | 'khalti' | 'bank_transfer';
          transaction_uuid: string | null;
          gateway_data: any;
          created_at: string;
          updated_at: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          supporter_id: string;
          creator_id: string;
          tier_id: string | null;
          amount: number;
          status: 'active' | 'paused' | 'cancelled' | 'expired';
          billing_cycle: 'monthly' | 'yearly' | 'one-time';
          next_billing_date: string | null;
          created_at: string;
          updated_at: string;
          cancelled_at: string | null;
        };
      };
    };
    Functions: {
      get_discovery_feed: {
        Args: { user_uuid: string; feed_limit?: number };
        Returns: {
          post_id: string;
          creator_id: string;
          creator_name: string;
          creator_avatar_url: string | null;
          creator_verified: boolean;
          post_title: string;
          post_content: string;
          post_number: number;
          post_thumbnail_url: string | null;
          post_created_at: string;
          likes_count: number;
          comments_count: number;
          views_count: number;
          user_has_liked: boolean;
          user_follows_creator: boolean;
        }[];
      };
      search_creators: {
        Args: { search_query: string; search_limit?: number };
        Returns: {
          user_id: string;
          display_name: string;
          avatar_url: string | null;
          description: string | null;
          bio: string | null;
          category: string | null;
          is_verified: boolean;
          followers_count: number;
          posts_count: number;
          total_earnings: number;
        }[];
      };
      get_creator_stats: {
        Args: { creator_uuid: string };
        Returns: {
          total_earnings: number;
          total_supporters: number;
          active_subscriptions: number;
          total_posts: number;
          total_followers: number;
          total_likes: number;
          total_comments: number;
        }[];
      };
      get_user_feed: {
        Args: { user_uuid: string; feed_limit?: number; feed_offset?: number };
        Returns: {
          post_id: string;
          creator_id: string;
          creator_name: string;
          creator_avatar_url: string | null;
          creator_verified: boolean;
          post_title: string;
          post_content: string;
          post_number: number;
          post_thumbnail_url: string | null;
          post_created_at: string;
          likes_count: number;
          comments_count: number;
          user_has_liked: boolean;
        }[];
      };
      increment_post_views: {
        Args: { post_uuid: string };
        Returns: void;
      };
    };
  };
}

export default supabase;

